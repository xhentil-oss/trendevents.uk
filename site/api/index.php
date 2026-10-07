<?php
// ============================================================
//  Trend Events REST API (JSON). All routes live under /api/.
//  See api/README.md for the full list with examples.
// ============================================================
declare(strict_types=1);

require __DIR__ . '/config.php';
require __DIR__ . '/lib.php';
require __DIR__ . '/admin.php';
require __DIR__ . '/content.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// CORS only for the extra origins in config.php (same-origin requests need nothing)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, ALLOWED_ORIGINS, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-Device-Token');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Vary: Origin');
}
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') send(204, null);

// Path after /api/, e.g. "venues/the-grand-hall"
$path = trim(preg_replace('#^.*?/api/?#', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/');
$parts = $path === '' ? [] : explode('/', $path);
$route = $parts[0] ?? '';
$param = isset($parts[1]) ? urldecode($parts[1]) : null;
$param2 = isset($parts[2]) ? urldecode($parts[2]) : null;

// Admin dashboard API (role = admin)
if ($route === 'admin') {
    try {
        admin_route($method, $param, $param2);
    } catch (Throwable $e) {
        error_log('Trend admin API error: ' . $e->getMessage());
        fail(500, DEBUG ? $e->getMessage() : 'Server error');
    }
}

try {
    switch ("$method $route") {
        case 'GET ':
            send(200, ['name' => 'Trend Events API', 'status' => 'ok']);

        // ------------------------------------------------ content
        case 'GET venues':
            $param ? venue_detail($param) : venues_list();
        case 'GET services':
            $param ? service_detail($param) : services_list();
        case 'GET packages':
            packages_list();
        case 'GET event-types':
            event_types_list();
        case 'GET portfolio':
            portfolio_list();
        case 'GET settings':
            send(200, array_column(all('SELECT setting_key, setting_value FROM site_settings'), 'setting_value', 'setting_key'));
        case 'GET content':
            public_content();
        case 'GET options':
            form_options();

        // ------------------------------------------------ requests
        case 'POST search-log':
            log_search();
        case 'POST quote':
            post_quote();
        case 'POST availability':
            post_availability();
        case 'POST build':
            post_build();

        // ------------------------------------------------ auth
        case 'POST register':
            register();
        case 'POST login':
            login();
        case 'POST forgot-password':
            forgot_password();
        case 'POST reset-password':
            reset_password();
        case 'POST logout':
            start_session();
            session_destroy();
            send(200, ['ok' => true]);
        case 'GET me':
            $id = current_user_id();
            send(200, ['user' => $id ? public_user($id) : null]);

        // ------------------------------------------------ saved venues
        case 'GET saved':
            saved_list();
        case 'POST saved':
            saved_add();
        case 'DELETE saved':
            saved_remove($param);
    }
    fail(404, 'Not found');
} catch (PDOException $e) {
    error_log('Trend API DB error: ' . $e->getMessage());
    fail(500, DEBUG ? $e->getMessage() : 'Database error');
} catch (Throwable $e) {
    error_log('Trend API error: ' . $e->getMessage());
    fail(500, DEBUG ? $e->getMessage() : 'Server error');
}

// ======================================================================
//  CONTENT
// ======================================================================

// GET /api/venues?category=wedding-venues&city=london&guests=100–200 guests
function venues_list(): void
{
    $where = ['v.is_active = 1'];
    $params = [];
    if (!empty($_GET['category'])) {
        $where[] = 'EXISTS (SELECT 1 FROM venue_category_map m JOIN venue_categories vc ON vc.id = m.category_id
                            WHERE m.venue_id = v.id AND (vc.slug = ? OR vc.name = ?))';
        array_push($params, $_GET['category'], $_GET['category']);
    }
    if (!empty($_GET['city'])) {
        $where[] = '(c.slug = ? OR c.name = ?)';
        array_push($params, $_GET['city'], $_GET['city']);
    }
    if (!empty($_GET['guests'])) {
        // Accepts a guest range label/id ("100–200 guests") or a plain number
        $g = $_GET['guests'];
        $min = ctype_digit((string) $g) && (int) $g > 5
            ? (int) $g
            : (int) (one('SELECT min_guests FROM guest_ranges WHERE label = ? OR id = ?', [$g, $g])['min_guests'] ?? 0);
        $where[] = 'v.capacity >= ?';
        $params[] = $min;
    }
    $rows = all(
        'SELECT v.id, v.slug, v.name, c.name city, c.slug city_slug, v.capacity, v.price_from, v.currency, v.description,
                (SELECT image_path FROM venue_images i WHERE i.venue_id = v.id ORDER BY i.is_cover DESC, i.sort_order LIMIT 1) image
         FROM venues v JOIN cities c ON c.id = v.city_id
         WHERE ' . implode(' AND ', $where) . ' ORDER BY v.sort_order',
        $params
    );
    foreach ($rows as &$r) $r['categories'] = venue_categories((int) $r['id']);
    send(200, $rows);
}

function venue_categories(int $venueId): array
{
    return array_column(all(
        'SELECT vc.name FROM venue_category_map m JOIN venue_categories vc ON vc.id = m.category_id
         WHERE m.venue_id = ? ORDER BY vc.sort_order',
        [$venueId]
    ), 'name');
}

function venue_detail(string $slug): void
{
    $v = one(
        'SELECT v.id, v.slug, v.name, c.name city, c.slug city_slug, v.capacity, v.price_from, v.currency, v.description, v.address
         FROM venues v JOIN cities c ON c.id = v.city_id WHERE v.slug = ? AND v.is_active = 1',
        [$slug]
    );
    if (!$v) fail(404, 'Venue not found');
    $v['categories'] = venue_categories((int) $v['id']);
    $v['images'] = all('SELECT image_path, alt_text, is_cover FROM venue_images WHERE venue_id = ? ORDER BY sort_order', [$v['id']]);
    send(200, $v);
}

// GET /api/services?category=food-decor&featured=1
function services_list(): void
{
    $where = ['s.is_active = 1'];
    $params = [];
    if (!empty($_GET['category'])) {
        $where[] = 'sc.slug = ?';
        $params[] = $_GET['category'];
    }
    if (!empty($_GET['featured'])) $where[] = 's.is_featured = 1';
    send(200, all(
        'SELECT s.id, s.slug, s.name, s.short_description, s.tagline, s.image, s.is_featured, sc.slug category_slug, sc.name category
         FROM services s JOIN service_categories sc ON sc.id = s.category_id
         WHERE ' . implode(' AND ', $where) . ' ORDER BY sc.sort_order, s.sort_order',
        $params
    ));
}

function service_detail(string $slug): void
{
    $s = one(
        'SELECT s.id, s.slug, s.name, s.short_description, s.tagline, s.long_description, s.image, sc.slug category_slug, sc.name category
         FROM services s JOIN service_categories sc ON sc.id = s.category_id WHERE s.slug = ? AND s.is_active = 1',
        [$slug]
    );
    if (!$s) fail(404, 'Service not found');
    $s['paragraphs'] = preg_split('/\R\R+/', (string) $s['long_description']);
    $s['features'] = array_column(all('SELECT feature FROM service_features WHERE service_id = ? ORDER BY sort_order', [$s['id']]), 'feature');
    $s['images'] = all('SELECT image_path, alt_text FROM service_images WHERE service_id = ? ORDER BY sort_order', [$s['id']]);
    send(200, $s);
}

function packages_list(): void
{
    $rows = all('SELECT id, slug, name, description, price_from, currency, image, is_popular FROM packages WHERE is_active = 1 ORDER BY sort_order');
    foreach ($rows as &$p) {
        $p['items'] = array_column(all('SELECT item FROM package_items WHERE package_id = ? ORDER BY sort_order', [$p['id']]), 'item');
    }
    send(200, $rows);
}

// GET /api/event-types?forms=1 → only the ones shown in dropdowns, in dropdown order
function event_types_list(): void
{
    $forms = !empty($_GET['forms']);
    $rows = all(
        'SELECT id, slug, name, form_label, tagline, description, min_guests, max_guests, image, show_in_forms
         FROM event_types WHERE is_active = 1' . ($forms ? ' AND show_in_forms = 1' : '') . ' ORDER BY sort_order'
    );
    foreach ($rows as &$e) {
        $e['features'] = array_column(all('SELECT feature FROM event_type_features WHERE event_type_id = ? ORDER BY sort_order', [$e['id']]), 'feature');
    }
    send(200, $rows);
}

// GET /api/portfolio?type=weddings
function portfolio_list(): void
{
    $params = [];
    $where = 'p.is_active = 1';
    if (!empty($_GET['type'])) {
        $where .= ' AND (et.slug = ? OR et.name = ?)';
        $params = [$_GET['type'], $_GET['type']];
    }
    send(200, all(
        "SELECT p.id, p.slug, p.title, p.cover_image, p.description, p.event_date, et.slug type_slug, et.name type
         FROM portfolio_items p JOIN event_types et ON et.id = p.event_type_id
         WHERE $where ORDER BY p.sort_order",
        $params
    ));
}

// Everything the site's dropdowns need, in one call
function form_options(): void
{
    send(200, [
        'event_types' => all('SELECT id, slug, form_label label FROM event_types WHERE is_active = 1 AND show_in_forms = 1 ORDER BY sort_order'),
        'cities' => all('SELECT id, slug, name FROM cities WHERE is_active = 1 ORDER BY sort_order'),
        'guest_ranges' => all('SELECT id, label, min_guests, max_guests FROM guest_ranges ORDER BY sort_order'),
    ]);
}

// ======================================================================
//  REQUESTS
// ======================================================================

// POST /api/quote — Get a Quote form (also package / service quotes)
function post_quote(): void
{
    $b = body();
    honeypot($b);
    [$errors, $contact] = contact($b);
    $fields = [
        'event_type_id' => resolve($b, 'event_type', 'event_type_id', $errors),
        'event_date' => null,
        'guest_range_id' => resolve($b, 'guests', 'guest_range_id', $errors),
        'city_id' => resolve($b, 'city', 'city_id', $errors),
        'venue_id' => resolve($b, 'venue', 'venue_id', $errors),
        'package_id' => resolve($b, 'package', 'package_id', $errors),
        'service_id' => resolve($b, 'service', 'service_id', $errors),
        'message' => str($b['message'] ?? null, 5000),
    ];
    if (!empty($b['event_date'])) {
        $fields['event_date'] = valid_date(str($b['event_date']));
        if (!$fields['event_date']) $errors['event_date'] = 'Use the format YYYY-MM-DD';
    }
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    $allowed = ['quote_form', 'venue_page', 'package_page', 'service_page', 'build_page', 'homepage_search'];
    $source = in_array($b['source'] ?? '', $allowed, true) ? $b['source']
        : ($fields['package_id'] ? 'package_page' : ($fields['service_id'] ? 'service_page' : ($fields['venue_id'] ? 'venue_page' : 'quote_form')));

    rate_limit();
    send(201, ['ok' => true, 'id' => save_quote($contact, $fields, $source)]);
}

// POST /api/availability — "Check Availability" on a venue page (venue + date + guests are required)
function post_availability(): void
{
    $b = body();
    honeypot($b);
    [$errors, $contact] = contact($b);
    $venue = resolve($b, 'venue', 'venue_id', $errors) ?? resolve($b, 'venue_id', 'venue_id', $errors);
    if (!$venue && !isset($errors['venue'])) $errors['venue'] = 'Venue is required';
    $date = valid_date(str($b['event_date'] ?? $b['date'] ?? null));
    if (!$date) $errors['event_date'] = 'Please choose a date (YYYY-MM-DD)';
    elseif ($date < date('Y-m-d')) $errors['event_date'] = 'The date must be in the future';
    $guests = resolve($b, 'guests', 'guest_range_id', $errors);
    if (!$guests && !isset($errors['guests'])) $errors['guests'] = 'Number of guests is required';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    $fields = [
        'venue_id' => $venue,
        'event_date' => $date,
        'guest_range_id' => $guests,
        'event_type_id' => resolve($b, 'event_type', 'event_type_id', $errors),
        'message' => str($b['message'] ?? null, 5000) ?? 'Availability check',
    ];
    rate_limit();
    send(201, ['ok' => true, 'id' => save_quote($contact, $fields, 'venue_page')]);
}

// POST /api/build — Build Your Event (+ chosen services). With contact details it also creates a quote request.
function post_build(): void
{
    $b = body();
    honeypot($b);
    $errors = [];
    $fields = [
        'event_type_id' => resolve($b, 'event_type', 'event_type_id', $errors),
        'city_id' => resolve($b, 'city', 'city_id', $errors),          // empty = "Any"
        'event_date' => null,
        'guest_range_id' => resolve($b, 'guests', 'guest_range_id', $errors),
        'venue_id' => resolve($b, 'venue', 'venue_id', $errors),       // empty = "To be suggested"
    ];
    if (!empty($b['event_date'])) {
        $fields['event_date'] = valid_date(str($b['event_date']));
        if (!$fields['event_date']) $errors['event_date'] = 'Use the format YYYY-MM-DD';
    }
    $services = [];
    foreach ((array) ($b['services'] ?? []) as $s) {
        $id = service_id($s);
        if ($id === null) $errors['services'] = "Unknown service: $s";
        else $services[$id] = true;
    }
    $wantsQuote = !empty($b['email']) || !empty($b['full_name']);
    $contact = null;
    if ($wantsQuote) {
        [$contactErrors, $contact] = contact($b);
        $errors += $contactErrors;
    }
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    rate_limit();
    $pdo = db();
    $pdo->beginTransaction();
    $quoteId = null;
    if ($wantsQuote) {
        $names = $services ? implode(', ', array_column(all(
            'SELECT name FROM services WHERE id IN (' . implode(',', array_fill(0, count($services), '?')) . ') ORDER BY sort_order',
            array_keys($services)
        ), 'name')) : '';
        $userMessage = str($b['message'] ?? null, 5000);
        // phpMyAdmin keeps the services in the message too; the emails show them as their own row
        $message = trim(($userMessage ?? '') . ($names ? "\n\nServices: $names" : ''));
        $quoteId = save_quote($contact, $fields + ['message' => $message ?: null], 'build_page', $names, $userMessage);
    }
    $buildId = run(
        'INSERT INTO event_builds (user_id, quote_request_id, event_type_id, city_id, event_date, guest_range_id, venue_id, `status`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [current_user_id(), $quoteId, $fields['event_type_id'], $fields['city_id'], $fields['event_date'],
         $fields['guest_range_id'], $fields['venue_id'], $wantsQuote ? 'submitted' : 'draft']
    );
    foreach (array_keys($services) as $sid) {
        run('INSERT INTO event_build_services (event_build_id, service_id) VALUES (?, ?)', [$buildId, $sid]);
    }
    $pdo->commit();
    send(201, ['ok' => true, 'id' => $buildId, 'quote_id' => $quoteId]);
}

// ======================================================================
//  AUTH
// ======================================================================

function register(): void
{
    $b = body();
    [$errors, $contact] = contact($b);
    $password = (string) ($b['password'] ?? '');
    if (strlen($password) < 8) $errors['password'] = 'Password must be at least 8 characters';
    if (!$errors && one('SELECT id FROM users WHERE email = ?', [$contact['email']])) $errors['email'] = 'An account with this email already exists';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    $id = run(
        'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
        [$contact['full_name'], $contact['email'], $contact['phone'], password_hash($password, PASSWORD_DEFAULT)]
    );
    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $id;
    adopt_device_saves($id);
    send(201, ['user' => public_user($id)]);
}

function login(): void
{
    $b = body();
    $email = str($b['email'] ?? null, 190);
    $user = $email ? one('SELECT id, password_hash FROM users WHERE email = ? AND is_active = 1', [$email]) : null;
    if (!$user || !password_verify((string) ($b['password'] ?? ''), $user['password_hash'])) {
        usleep(300000); // slow down password guessing
        fail(401, 'Incorrect email or password');
    }
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash((string) $b['password'], PASSWORD_DEFAULT), $user['id']]);
    }
    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    adopt_device_saves((int) $user['id']);
    send(200, ['user' => public_user((int) $user['id'])]);
}

// Venues saved as a guest on this device move to the account after login/registration
function adopt_device_saves(int $userId): void
{
    $token = device_token();
    if (!$token) return;
    run(
        'INSERT IGNORE INTO saved_venues (user_id, venue_id) SELECT ?, venue_id FROM saved_venues WHERE device_token = ? AND user_id IS NULL',
        [$userId, $token]
    );
    run('DELETE FROM saved_venues WHERE device_token = ? AND user_id IS NULL', [$token]);
}

// ======================================================================
//  SAVED VENUES — logged-in user, or a guest identified by X-Device-Token
// ======================================================================

function saved_owner(): array
{
    $uid = current_user_id();
    if ($uid) return ['user_id = ?', $uid, 'user_id'];
    $token = device_token();
    if (!$token) fail(401, 'Log in or send an X-Device-Token header');
    return ['device_token = ? AND user_id IS NULL', $token, 'device_token'];
}

function saved_list(): void
{
    [$where, $owner] = saved_owner();
    send(200, all(
        "SELECT v.slug, v.name, c.name city, v.capacity, v.price_from, s.created_at saved_at
         FROM saved_venues s JOIN venues v ON v.id = s.venue_id JOIN cities c ON c.id = v.city_id
         WHERE s.$where ORDER BY s.created_at DESC",
        [$owner]
    ));
}

function saved_add(): void
{
    [, $owner, $column] = saved_owner();
    $errors = [];
    $venue = resolve(body(), 'venue', 'venue_id', $errors) ?? resolve(body(), 'venue_id', 'venue_id', $errors);
    if (!$venue) fail(422, 'Unknown venue', $errors ?: ['venue' => 'Venue is required']);
    run("INSERT IGNORE INTO saved_venues ($column, venue_id) VALUES (?, ?)", [$owner, $venue]);
    send(201, ['ok' => true]);
}

// DELETE /api/saved/{venue-slug}
function saved_remove(?string $venue): void
{
    [$where, $owner] = saved_owner();
    $id = venue_id($venue ?? (body()['venue'] ?? null));
    if (!$id) fail(422, 'Unknown venue');
    run("DELETE FROM saved_venues WHERE $where AND venue_id = ?", [$owner, $id]);
    send(200, ['ok' => true]);
}

// ======================================================================
//  PASSWORD RESET
// ======================================================================

// Created on first use, so an already-imported database needs no manual change
function ensure_reset_table(): void
{
    db()->exec(
        'CREATE TABLE IF NOT EXISTS password_resets (
           id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
           user_id    INT UNSIGNED NOT NULL,
           token_hash CHAR(64) NOT NULL,
           expires_at DATETIME NOT NULL,
           used_at    DATETIME NULL,
           ip_address VARCHAR(45) NULL,
           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
           PRIMARY KEY (id),
           UNIQUE KEY uq_pr_token (token_hash),
           KEY idx_pr_user (user_id, created_at),
           CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

// POST /api/forgot-password { email } — always answers the same way, so it can't be used
// to find out which emails have an account
function forgot_password(): void
{
    $email = str(body()['email'] ?? null, 190);
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail(422, 'Please enter a valid email address', ['email' => 'Please enter a valid email address']);
    $done = ['ok' => true, 'message' => 'If an account exists for this email, we have sent a link to reset the password.'];

    ensure_reset_table();
    $user = one('SELECT id, full_name, email FROM users WHERE email = ? AND is_active = 1', [$email]);
    if (!$user) {
        usleep(400000);
        send(200, $done);
    }
    // Max 3 emails per account per hour
    $recent = one('SELECT COUNT(*) n FROM password_resets WHERE user_id = ? AND created_at > (NOW() - INTERVAL 1 HOUR)', [$user['id']]);
    if ((int) $recent['n'] >= 3) send(200, $done);

    $token = bin2hex(random_bytes(32));
    run(
        'INSERT INTO password_resets (user_id, token_hash, expires_at, ip_address) VALUES (?, ?, NOW() + INTERVAL 1 HOUR, ?)',
        [$user['id'], hash('sha256', $token), client_ip()]
    );
    $url = rtrim(cfg('SITE_URL', 'https://trendevents.uk'), '/') . '/reset-password?token=' . $token;
    $first = explode(' ', $user['full_name'])[0];
    $text = "Hi $first,\n\nWe received a request to reset the password for your Trend Events account.\n\n"
        . "Choose a new password here (the link works for 1 hour):\n$url\n\n"
        . "If you didn't ask for this, you can ignore this email — your password stays the same.\n\nTrend Events";
    $html = email_html(
        "Reset your password",
        "Hi $first, we received a request to reset the password for your Trend Events account. The link below works for 1 hour.",
        'Choose a new password',
        $url,
        "If you didn't ask for this, you can ignore this email — your password stays the same. If the button doesn't work, copy this link into your browser:"
    );
    if (!send_mail($user['email'], 'Reset your Trend Events password', $text, $html)) {
        fail(500, 'We could not send the email right now. Please try again later or contact us.');
    }
    send(200, $done);
}

// POST /api/reset-password { token, password } — sets the new password and signs the user in
function reset_password(): void
{
    $b = body();
    $token = (string) ($b['token'] ?? '');
    $password = (string) ($b['password'] ?? '');
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) fail(400, 'This reset link is not valid. Please request a new one.');
    if (strlen($password) < 8) fail(422, 'Password must be at least 8 characters', ['password' => 'Password must be at least 8 characters']);

    ensure_reset_table();
    $row = one(
        'SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()',
        [hash('sha256', $token)]
    );
    if (!$row) fail(400, 'This reset link has expired or was already used. Please request a new one.');

    $pdo = db();
    $pdo->beginTransaction();
    run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $row['user_id']]);
    // Every outstanding link for this account stops working
    run('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [$row['user_id']]);
    $pdo->commit();

    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $row['user_id'];
    adopt_device_saves((int) $row['user_id']);
    send(200, ['ok' => true, 'user' => public_user((int) $row['user_id'])]);
}
