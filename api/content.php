<?php
// ============================================================
//  Site content from the database
//  - GET /api/content            → everything the website shows (public)
//  - /api/admin/venues|packages|portfolio|event-types|services|settings|upload → editing (admin)
// ============================================================

function slugify(string $s): string
{
    $s = strtolower(trim($s));
    $s = str_replace('&', 'and', $s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-') ?: 'item';
}

// Unique slug in $table, ignoring row $exceptId
function unique_slug(string $table, string $base, int $exceptId = 0): string
{
    $slug = slugify($base);
    $try = $slug;
    for ($i = 2; one("SELECT id FROM $table WHERE slug = ? AND id <> ?", [$try, $exceptId]); $i++) $try = "$slug-$i";
    return $try;
}

function lines($value, int $max = 30): array
{
    $list = is_array($value) ? $value : preg_split('/\R/', (string) $value);
    $list = array_values(array_filter(array_map(fn ($x) => str($x, 255), $list)));
    return array_slice($list, 0, $max);
}

function image_ref($value): ?string
{
    $v = str($value, 255);
    if ($v === null) return null;
    // site path ("/images/…", "/uploads/…") or full https URL
    if (!preg_match('#^(/[A-Za-z0-9/_.()\- ]+|https://[^\s"\'<>]+)$#', $v)) return null;
    return $v;
}

function images($value, int $max = 12): array
{
    return array_slice(array_values(array_filter(array_map('image_ref', (array) $value))), 0, $max);
}

// ---------------------------------------------------------------- public

function public_content(): void
{
    $venues = all(
        'SELECT v.id, v.slug, v.name, c.name city, v.capacity, v.price_from, v.description
         FROM venues v JOIN cities c ON c.id = v.city_id WHERE v.is_active = 1 ORDER BY v.sort_order, v.id'
    );
    foreach ($venues as &$v) {
        $v['images'] = array_column(all('SELECT image_path FROM venue_images WHERE venue_id = ? ORDER BY is_cover DESC, sort_order', [$v['id']]), 'image_path');
        $v['categories'] = venue_categories((int) $v['id']);
        unset($v['id']);
    }
    unset($v);

    $packages = all('SELECT id, slug, name, description, price_from, image, is_popular FROM packages WHERE is_active = 1 ORDER BY sort_order, id');
    foreach ($packages as &$p) {
        $p['items'] = array_column(all('SELECT item FROM package_items WHERE package_id = ? ORDER BY sort_order', [$p['id']]), 'item');
        unset($p['id']);
    }
    unset($p);

    $events = all("SELECT id, slug, name, tagline, description, min_guests, max_guests, image FROM event_types WHERE slug <> 'other' ORDER BY sort_order");
    foreach ($events as &$e) {
        $e['features'] = array_column(all('SELECT feature FROM event_type_features WHERE event_type_id = ? ORDER BY sort_order', [$e['id']]), 'feature');
        unset($e['id']);
    }
    unset($e);

    $services = all('SELECT id, slug, short_description, tagline, long_description, image FROM services WHERE is_active = 1');
    foreach ($services as &$s) {
        $s['features'] = array_column(all('SELECT feature FROM service_features WHERE service_id = ? ORDER BY sort_order', [$s['id']]), 'feature');
        $s['gallery'] = array_column(all('SELECT image_path FROM service_images WHERE service_id = ? ORDER BY sort_order', [$s['id']]), 'image_path');
        unset($s['id']);
    }
    unset($s);

    header('Cache-Control: no-cache');
    send(200, [
        'venues' => $venues,
        'packages' => $packages,
        'event_types' => $events,
        'services' => $services,
        'portfolio' => all(
            'SELECT p.title, et.name type, p.cover_image FROM portfolio_items p JOIN event_types et ON et.id = p.event_type_id
             WHERE p.is_active = 1 ORDER BY p.sort_order, p.id'
        ),
        'settings' => array_column(all('SELECT setting_key, setting_value FROM site_settings'), 'setting_value', 'setting_key'),
    ]);
}

// ---------------------------------------------------------------- admin router

function admin_content_route(string $method, string $section, ?string $id): void
{
    $id = $id !== null ? (int) $id : 0;
    switch ("$method $section") {
        case 'POST upload':
            admin_upload();
        case 'GET venues':
            admin_venues();
        case 'POST venues':
            admin_save_venue($id);
        case 'DELETE venues':
            admin_delete('venues', $id);
        case 'GET packages':
            admin_packages();
        case 'POST packages':
            admin_save_package($id);
        case 'DELETE packages':
            admin_delete('packages', $id);
        case 'GET portfolio':
            admin_portfolio();
        case 'POST portfolio':
            admin_save_portfolio($id);
        case 'DELETE portfolio':
            admin_delete('portfolio_items', $id);
        case 'GET event-types':
            admin_event_types();
        case 'POST event-types':
            admin_save_event_type($id);
        case 'GET services':
            admin_services();
        case 'POST services':
            admin_save_service($id);
        case 'GET settings':
            admin_settings();
        case 'POST settings':
            admin_save_settings();
    }
    fail(404, 'Not found');
}

function admin_delete(string $table, int $id): void
{
    if (!one("SELECT id FROM $table WHERE id = ?", [$id])) fail(404, 'Not found');
    run("DELETE FROM $table WHERE id = ?", [$id]);
    send(200, ['ok' => true]);
}

function next_sort(string $table): int
{
    return (int) one("SELECT COALESCE(MAX(sort_order), 0) + 1 n FROM $table")['n'];
}

// ---------------------------------------------------------------- uploads

// POST /api/admin/upload (multipart, field "file") → {"path": "/uploads/2026/10/abc.jpg"}
function admin_upload(): void
{
    $f = $_FILES['file'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        $tooBig = $f && in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
        fail(422, $tooBig ? 'The photo is too large for the server (try a smaller file)' : 'Please choose a photo');
    }
    if ($f['size'] > 10 * 1024 * 1024) fail(422, 'The photo must be smaller than 10 MB');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/avif' => 'avif', 'image/gif' => 'gif'][$mime] ?? null;
    if (!$ext) fail(422, 'Only JPG, PNG, WEBP, AVIF or GIF photos are allowed');

    $root = dirname(__DIR__) . '/uploads';
    if (!is_dir($root)) @mkdir($root, 0755, true);
    // Never run scripts from the uploads folder
    if (!is_file("$root/.htaccess")) {
        @file_put_contents("$root/.htaccess", "Options -Indexes\n<FilesMatch \"\\.(php[0-9]?|phtml|phar|cgi|pl|py|sh)$\">\n  Require all denied\n</FilesMatch>\n");
    }
    $sub = date('Y/m');
    if (!is_dir("$root/$sub") && !@mkdir("$root/$sub", 0755, true)) fail(500, 'Could not create the uploads folder');
    $name = bin2hex(random_bytes(8)) . ".$ext";
    if (!move_uploaded_file($f['tmp_name'], "$root/$sub/$name")) fail(500, 'Could not save the photo');
    @chmod("$root/$sub/$name", 0644);
    send(201, ['path' => "/uploads/$sub/$name"]);
}

// ---------------------------------------------------------------- venues

function admin_venues(): void
{
    $rows = all(
        'SELECT v.id, v.slug, v.name, v.city_id, c.name city, v.capacity, v.price_from, v.description, v.is_active
         FROM venues v JOIN cities c ON c.id = v.city_id ORDER BY v.sort_order, v.id'
    );
    foreach ($rows as &$r) {
        $r['images'] = array_column(all('SELECT image_path FROM venue_images WHERE venue_id = ? ORDER BY is_cover DESC, sort_order', [$r['id']]), 'image_path');
        $r['categories'] = venue_categories((int) $r['id']);
    }
    send(200, ['rows' => $rows, 'options' => [
        'cities' => all('SELECT id value, name label FROM cities ORDER BY sort_order'),
        'categories' => array_column(all('SELECT name FROM venue_categories ORDER BY sort_order'), 'name'),
    ]]);
}

function admin_save_venue(int $id): void
{
    $b = body();
    $errors = [];
    $name = str($b['name'] ?? null, 150);
    if (!$name) $errors['name'] = 'Name is required';
    $city = (int) ($b['city_id'] ?? 0);
    if (!one('SELECT id FROM cities WHERE id = ?', [$city])) $errors['city_id'] = 'Choose a city';
    $capacity = (int) ($b['capacity'] ?? 0);
    if ($capacity < 1) $errors['capacity'] = 'Capacity must be a number';
    $price = is_numeric($b['price_from'] ?? null) ? round((float) $b['price_from'], 2) : null;
    if ($price === null || $price < 0) $errors['price_from'] = 'Price must be a number';
    $imgs = images($b['images'] ?? []);
    if (!$imgs) $errors['images'] = 'Add at least one photo';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    $data = [$name, $city, $capacity, $price, str($b['description'] ?? null, 2000), !empty($b['is_active']) ? 1 : 0];
    $pdo = db();
    $pdo->beginTransaction();
    if ($id) {
        if (!one('SELECT id FROM venues WHERE id = ?', [$id])) fail(404, 'Venue not found');
        run('UPDATE venues SET name = ?, city_id = ?, capacity = ?, price_from = ?, description = ?, is_active = ? WHERE id = ?', [...$data, $id]);
    } else {
        $id = run(
            'INSERT INTO venues (name, city_id, capacity, price_from, description, is_active, slug, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [...$data, unique_slug('venues', $name), next_sort('venues')]
        );
    }
    run('DELETE FROM venue_category_map WHERE venue_id = ?', [$id]);
    foreach ((array) ($b['categories'] ?? []) as $cat) {
        $c = one('SELECT id FROM venue_categories WHERE name = ?', [(string) $cat]);
        if ($c) run('INSERT IGNORE INTO venue_category_map (venue_id, category_id) VALUES (?, ?)', [$id, $c['id']]);
    }
    run('DELETE FROM venue_images WHERE venue_id = ?', [$id]);
    foreach ($imgs as $i => $path) {
        run('INSERT INTO venue_images (venue_id, image_path, alt_text, is_cover, sort_order) VALUES (?, ?, ?, ?, ?)', [$id, $path, $name, $i === 0 ? 1 : 0, $i + 1]);
    }
    $pdo->commit();
    admin_venues();
}

// ---------------------------------------------------------------- packages

function admin_packages(): void
{
    $rows = all('SELECT id, slug, name, description, price_from, image, is_popular, is_active FROM packages ORDER BY sort_order, id');
    foreach ($rows as &$r) {
        $r['items'] = array_column(all('SELECT item FROM package_items WHERE package_id = ? ORDER BY sort_order', [$r['id']]), 'item');
    }
    send(200, ['rows' => $rows]);
}

function admin_save_package(int $id): void
{
    $b = body();
    $errors = [];
    $name = str($b['name'] ?? null, 150);
    if (!$name) $errors['name'] = 'Name is required';
    $priceRaw = trim((string) ($b['price_from'] ?? ''));
    $price = $priceRaw === '' ? null : (is_numeric($priceRaw) ? round((float) $priceRaw, 2) : false);
    if ($price === false) $errors['price_from'] = 'Price must be a number, or empty for "Tailored price"';
    $image = image_ref($b['image'] ?? null);
    if (!$image) $errors['image'] = 'Add a photo';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    // The site links to packages by a slug made from the name, so keep them in step
    $data = [$name, unique_slug('packages', $name, $id), str($b['description'] ?? null, 500), $price, $image, !empty($b['is_popular']) ? 1 : 0, !empty($b['is_active']) ? 1 : 0];
    $pdo = db();
    $pdo->beginTransaction();
    if ($id) {
        if (!one('SELECT id FROM packages WHERE id = ?', [$id])) fail(404, 'Package not found');
        run('UPDATE packages SET name = ?, slug = ?, description = ?, price_from = ?, image = ?, is_popular = ?, is_active = ? WHERE id = ?', [...$data, $id]);
    } else {
        $id = run(
            'INSERT INTO packages (name, slug, description, price_from, image, is_popular, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [...$data, next_sort('packages')]
        );
    }
    run('DELETE FROM package_items WHERE package_id = ?', [$id]);
    foreach (lines($b['items'] ?? []) as $i => $item) run('INSERT INTO package_items (package_id, item, sort_order) VALUES (?, ?, ?)', [$id, $item, $i + 1]);
    $pdo->commit();
    admin_packages();
}

// ---------------------------------------------------------------- portfolio (Our Work)

function admin_portfolio(): void
{
    send(200, [
        'rows' => all(
            'SELECT p.id, p.title, p.event_type_id, et.name type, p.cover_image, p.is_active
             FROM portfolio_items p JOIN event_types et ON et.id = p.event_type_id ORDER BY p.sort_order, p.id'
        ),
        'options' => ['event_types' => all("SELECT id value, name label FROM event_types WHERE slug <> 'other' ORDER BY sort_order")],
    ]);
}

function admin_save_portfolio(int $id): void
{
    $b = body();
    $errors = [];
    $title = str($b['title'] ?? null, 200);
    if (!$title) $errors['title'] = 'Title is required';
    $type = (int) ($b['event_type_id'] ?? 0);
    if (!one('SELECT id FROM event_types WHERE id = ?', [$type])) $errors['event_type_id'] = 'Choose an event type';
    $image = image_ref($b['cover_image'] ?? null);
    if (!$image) $errors['cover_image'] = 'Add a photo';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    $data = [$title, unique_slug('portfolio_items', $title, $id), $type, $image, !empty($b['is_active']) ? 1 : 0];
    $pdo = db();
    $pdo->beginTransaction();
    if ($id) {
        if (!one('SELECT id FROM portfolio_items WHERE id = ?', [$id])) fail(404, 'Not found');
        run('UPDATE portfolio_items SET title = ?, slug = ?, event_type_id = ?, cover_image = ?, is_active = ? WHERE id = ?', [...$data, $id]);
    } else {
        $id = run('INSERT INTO portfolio_items (title, slug, event_type_id, cover_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)', [...$data, next_sort('portfolio_items')]);
    }
    run('DELETE FROM portfolio_images WHERE portfolio_id = ?', [$id]);
    run('INSERT INTO portfolio_images (portfolio_id, image_path, alt_text, sort_order) VALUES (?, ?, ?, 1)', [$id, $image, $title]);
    $pdo->commit();
    admin_portfolio();
}

// ---------------------------------------------------------------- event types (edit only)

function admin_event_types(): void
{
    $rows = all("SELECT id, slug, name, tagline, description, min_guests, max_guests, image FROM event_types WHERE slug <> 'other' ORDER BY sort_order");
    foreach ($rows as &$r) {
        $r['features'] = array_column(all('SELECT feature FROM event_type_features WHERE event_type_id = ? ORDER BY sort_order', [$r['id']]), 'feature');
    }
    send(200, ['rows' => $rows]);
}

function admin_save_event_type(int $id): void
{
    $b = body();
    if (!$id || !one("SELECT id FROM event_types WHERE id = ? AND slug <> 'other'", [$id])) fail(404, 'Event type not found');
    $num = fn ($v) => ($v === '' || $v === null) ? null : (is_numeric($v) ? max(0, (int) $v) : false);
    $min = $num($b['min_guests'] ?? null);
    $max = $num($b['max_guests'] ?? null);
    $errors = [];
    if ($min === false) $errors['min_guests'] = 'Must be a number';
    if ($max === false) $errors['max_guests'] = 'Must be a number';
    $image = image_ref($b['image'] ?? null);
    if (!$image) $errors['image'] = 'Add a photo';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    $pdo = db();
    $pdo->beginTransaction();
    run(
        'UPDATE event_types SET tagline = ?, description = ?, min_guests = ?, max_guests = ?, image = ? WHERE id = ?',
        [str($b['tagline'] ?? null, 255), str($b['description'] ?? null, 3000), $min, $max, $image, $id]
    );
    run('DELETE FROM event_type_features WHERE event_type_id = ?', [$id]);
    foreach (lines($b['features'] ?? []) as $i => $f) run('INSERT INTO event_type_features (event_type_id, feature, sort_order) VALUES (?, ?, ?)', [$id, $f, $i + 1]);
    $pdo->commit();
    admin_event_types();
}

// ---------------------------------------------------------------- services (edit only)

function admin_services(): void
{
    $rows = all(
        'SELECT s.id, s.slug, s.name, sc.name category, s.short_description, s.tagline, s.long_description, s.image, s.is_featured
         FROM services s JOIN service_categories sc ON sc.id = s.category_id ORDER BY sc.sort_order, s.name'
    );
    foreach ($rows as &$r) {
        $r['features'] = array_column(all('SELECT feature FROM service_features WHERE service_id = ? ORDER BY sort_order', [$r['id']]), 'feature');
        $r['gallery'] = array_column(all('SELECT image_path FROM service_images WHERE service_id = ? ORDER BY sort_order', [$r['id']]), 'image_path');
    }
    send(200, ['rows' => $rows]);
}

function admin_save_service(int $id): void
{
    $b = body();
    $s = $id ? one('SELECT id, name FROM services WHERE id = ?', [$id]) : null;
    if (!$s) fail(404, 'Service not found');
    $image = image_ref($b['image'] ?? null);
    $gallery = images($b['gallery'] ?? [], 8);
    $errors = [];
    if (!$image) $errors['image'] = 'Add a card photo';
    if (!$gallery) $errors['gallery'] = 'Add at least one gallery photo';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);

    $pdo = db();
    $pdo->beginTransaction();
    run(
        'UPDATE services SET short_description = ?, tagline = ?, long_description = ?, image = ? WHERE id = ?',
        [str($b['short_description'] ?? null, 255), str($b['tagline'] ?? null, 255), str($b['long_description'] ?? null, 5000), $image, $id]
    );
    run('DELETE FROM service_features WHERE service_id = ?', [$id]);
    foreach (lines($b['features'] ?? []) as $i => $f) run('INSERT INTO service_features (service_id, feature, sort_order) VALUES (?, ?, ?)', [$id, $f, $i + 1]);
    run('DELETE FROM service_images WHERE service_id = ?', [$id]);
    foreach ($gallery as $i => $g) run('INSERT INTO service_images (service_id, image_path, alt_text, sort_order) VALUES (?, ?, ?, ?)', [$id, $g, $s['name'], $i + 1]);
    $pdo->commit();
    admin_services();
}

// ---------------------------------------------------------------- settings

const EDITABLE_SETTINGS = ['phone', 'email', 'instagram_url', 'address', 'working_hours'];

function admin_settings(): void
{
    $all = array_column(all('SELECT setting_key, setting_value FROM site_settings'), 'setting_value', 'setting_key');
    send(200, ['row' => array_combine(EDITABLE_SETTINGS, array_map(fn ($k) => $all[$k] ?? '', EDITABLE_SETTINGS))]);
}

function admin_save_settings(): void
{
    $b = body();
    $errors = [];
    if (!empty($b['email']) && !filter_var($b['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Not a valid email';
    if (!empty($b['instagram_url']) && !preg_match('#^https://#', $b['instagram_url'])) $errors['instagram_url'] = 'Must start with https://';
    if ($errors) fail(422, 'Please check the highlighted fields', $errors);
    foreach (EDITABLE_SETTINGS as $k) {
        if (!array_key_exists($k, $b)) continue;
        run(
            'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
            [$k, str($b[$k], 255)]
        );
    }
    admin_settings();
}

// ============================================================
//  Search statistics — what visitors look for in the search bar
// ============================================================

// Created on first use, so the live database needs no manual change
function ensure_search_table(): void
{
    db()->exec(
        'CREATE TABLE IF NOT EXISTS searches (
           id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
           event_type_id  INT UNSIGNED NULL,
           city_id        INT UNSIGNED NULL,
           event_date     DATE NULL,
           guest_range_id INT UNSIGNED NULL,
           page           VARCHAR(40) NULL,
           user_id        INT UNSIGNED NULL,
           device_token   VARCHAR(64) NULL,
           ip_address     VARCHAR(45) NULL,
           created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
           PRIMARY KEY (id),
           KEY idx_searches_created (created_at),
           KEY idx_searches_ip (ip_address, created_at),
           CONSTRAINT fk_s_event_type FOREIGN KEY (event_type_id) REFERENCES event_types (id) ON DELETE SET NULL,
           CONSTRAINT fk_s_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE SET NULL,
           CONSTRAINT fk_s_guests FOREIGN KEY (guest_range_id) REFERENCES guest_ranges (id) ON DELETE SET NULL,
           CONSTRAINT fk_s_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
}

// POST /api/search-log { event_type, city, date, guests, page } — silent, never blocks the visitor
function log_search(): void
{
    $b = body();
    $type = event_type_id($b['event_type'] ?? null);
    $city = city_id($b['city'] ?? null);
    $guests = guest_range_id($b['guests'] ?? null);
    $date = valid_date(str($b['date'] ?? null));
    if (!$type && !$city && !$guests && !$date) send(200, ['ok' => true]); // empty search: nothing to learn

    ensure_search_table();
    // max 30 per IP per 10 minutes (protects the statistics from spam)
    $n = (int) one('SELECT COUNT(*) n FROM searches WHERE ip_address = ? AND created_at > (NOW() - INTERVAL 10 MINUTE)', [client_ip()])['n'];
    if ($n >= 30) send(200, ['ok' => true]);

    $page = preg_replace('/[^a-z0-9\/-]/', '', strtolower((string) ($b['page'] ?? ''))) ?: null;
    run(
        'INSERT INTO searches (event_type_id, city_id, event_date, guest_range_id, page, user_id, device_token, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [$type, $city, $date, $guests, $page ? substr($page, 0, 40) : null, current_user_id(), device_token(), client_ip()]
    );
    send(201, ['ok' => true]);
}

// GET /api/admin/searches?days=30 (0 = all time)
function admin_searches(): void
{
    ensure_search_table();
    $days = max(0, min(3650, (int) ($_GET['days'] ?? 30)));
    $where = $days ? "WHERE s.created_at >= (NOW() - INTERVAL $days DAY)" : '';
    $from = 'FROM searches s
             LEFT JOIN event_types et ON et.id = s.event_type_id
             LEFT JOIN cities c ON c.id = s.city_id
             LEFT JOIN guest_ranges gr ON gr.id = s.guest_range_id';
    $top = fn (string $label, string $group) => all(
        // group by the column expressions themselves ("label" would clash with guest_ranges.label)
        "SELECT $label label, COUNT(*) n $from $where " . ($where ? 'AND' : 'WHERE') . " $group IS NOT NULL GROUP BY $group, $label ORDER BY n DESC LIMIT 10"
    );
    send(200, [
        'days' => $days,
        'total' => (int) one("SELECT COUNT(*) n $from $where")['n'],
        'visitors' => (int) one("SELECT COUNT(DISTINCT COALESCE(s.device_token, s.ip_address)) n $from $where")['n'],
        'event_types' => $top('et.form_label', 's.event_type_id'),
        'cities' => $top('c.name', 's.city_id'),
        'guests' => $top('gr.label', 's.guest_range_id'),
        'months' => all(
            "SELECT DATE_FORMAT(s.event_date, '%Y-%m') month, COUNT(*) n $from $where " . ($where ? 'AND' : 'WHERE') . "
             s.event_date IS NOT NULL GROUP BY month ORDER BY month LIMIT 24"
        ),
        'combos' => all(
            "SELECT et.form_label event_type, c.name city, gr.label guests, COUNT(*) n $from $where
             GROUP BY s.event_type_id, s.city_id, s.guest_range_id, et.form_label, c.name, gr.label ORDER BY n DESC LIMIT 10"
        ),
        'recent' => all(
            "SELECT s.created_at, et.form_label event_type, c.name city, s.event_date, gr.label guests, s.page, u.full_name
             $from LEFT JOIN users u ON u.id = s.user_id $where ORDER BY s.created_at DESC LIMIT 40"
        ),
    ]);
}
