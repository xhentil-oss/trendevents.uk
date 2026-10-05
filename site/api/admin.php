<?php
// ============================================================
//  Trend Events — admin API (/api/admin/...). Only users with role = 'admin'.
//  Make someone admin in phpMyAdmin:
//    UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
// ============================================================

const SOURCES = [
    'quote_form' => 'Get a Quote', 'venue_page' => 'Check Availability', 'package_page' => 'Package',
    'service_page' => 'Service', 'build_page' => 'Build Your Event', 'homepage_search' => 'Homepage search',
];
const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

function require_admin(): array
{
    $uid = current_user_id();
    $user = $uid ? public_user($uid) : null;
    if (!$user) fail(401, 'Please sign in');
    if ($user['role'] !== 'admin') fail(403, 'This account does not have admin access');
    return $user;
}

function admin_route(string $method, ?string $section, ?string $id): void
{
    require_admin();
    switch ("$method $section") {
        case 'GET stats':
            admin_stats();
        case 'GET requests':
            $id ? admin_request((int) $id) : admin_requests();
        case 'POST requests':
            admin_update_request((int) $id);
        case 'DELETE requests':
            run('DELETE FROM quote_requests WHERE id = ?', [(int) $id]);
            send(200, ['ok' => true]);
        case 'GET export':
            admin_export();
        case 'GET events':
            admin_events();
        case 'GET users':
            admin_users();
        case 'POST users':
            admin_update_user((int) $id);
        case 'GET saved':
            admin_saved();
    }
    fail(404, 'Not found');
}

// Common SELECT for request lists, with readable names instead of ids
function request_select(): string
{
    return "SELECT q.id, q.created_at, q.`status`, q.source, q.full_name, q.email, q.phone, q.event_date, q.message,
                   q.admin_notes, q.user_id, et.form_label event_type, gr.label guests, c.name city,
                   v.name venue, v.slug venue_slug, p.name package, s.name service,
                   (SELECT b.id FROM event_builds b WHERE b.quote_request_id = q.id LIMIT 1) build_id
            FROM quote_requests q
            LEFT JOIN event_types et ON et.id = q.event_type_id
            LEFT JOIN guest_ranges gr ON gr.id = q.guest_range_id
            LEFT JOIN cities c ON c.id = q.city_id
            LEFT JOIN venues v ON v.id = q.venue_id
            LEFT JOIN packages p ON p.id = q.package_id
            LEFT JOIN services s ON s.id = q.service_id";
}

function with_labels(array $rows): array
{
    foreach ($rows as &$r) $r['source_label'] = SOURCES[$r['source']] ?? $r['source'];
    return $rows;
}

// Filters shared by the list and the CSV export: ?status=&source=&q=&from=&to=
function request_filters(): array
{
    $where = [];
    $params = [];
    if (in_array($_GET['status'] ?? '', STATUSES, true)) {
        $where[] = 'q.`status` = ?';
        $params[] = $_GET['status'];
    }
    if (isset(SOURCES[$_GET['source'] ?? ''])) {
        $where[] = 'q.source = ?';
        $params[] = $_GET['source'];
    }
    if (!empty($_GET['q'])) {
        $where[] = '(q.full_name LIKE ? OR q.email LIKE ? OR q.phone LIKE ? OR q.message LIKE ?)';
        $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $_GET['q']) . '%';
        array_push($params, $like, $like, $like, $like);
    }
    if ($from = valid_date($_GET['from'] ?? null)) {
        $where[] = 'q.created_at >= ?';
        $params[] = $from;
    }
    if ($to = valid_date($_GET['to'] ?? null)) {
        $where[] = 'q.created_at < (? + INTERVAL 1 DAY)';
        $params[] = $to;
    }
    return [$where ? ' WHERE ' . implode(' AND ', $where) : '', $params];
}

function admin_stats(): void
{
    $n = fn ($sql, $p = []) => (int) (one($sql, $p)['n'] ?? 0);
    send(200, [
        'requests' => $n('SELECT COUNT(*) n FROM quote_requests'),
        'new' => $n("SELECT COUNT(*) n FROM quote_requests WHERE `status` = 'new'"),
        'this_month' => $n("SELECT COUNT(*) n FROM quote_requests WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"),
        'won' => $n("SELECT COUNT(*) n FROM quote_requests WHERE `status` = 'won'"),
        'upcoming_events' => $n('SELECT COUNT(*) n FROM quote_requests WHERE event_date >= CURDATE()'),
        'users' => $n('SELECT COUNT(*) n FROM users'),
        'saved' => $n('SELECT COUNT(*) n FROM saved_venues'),
        'by_status' => all('SELECT `status`, COUNT(*) n FROM quote_requests GROUP BY `status`'),
        'by_source' => with_labels(all('SELECT source, COUNT(*) n FROM quote_requests GROUP BY source ORDER BY n DESC')),
        'by_event_type' => all(
            'SELECT COALESCE(et.name, "Not specified") name, COUNT(*) n FROM quote_requests q
             LEFT JOIN event_types et ON et.id = q.event_type_id GROUP BY name ORDER BY n DESC'
        ),
        'recent' => with_labels(all(request_select() . ' ORDER BY q.created_at DESC LIMIT 6')),
        'next_events' => with_labels(all(request_select() . ' WHERE q.event_date >= CURDATE() ORDER BY q.event_date LIMIT 5')),
    ]);
}

function admin_requests(): void
{
    [$where, $params] = request_filters();
    $limit = 50;
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $total = (int) one("SELECT COUNT(*) n FROM quote_requests q$where", $params)['n'];
    $rows = all(request_select() . "$where ORDER BY q.created_at DESC LIMIT $limit OFFSET " . (($page - 1) * $limit), $params);
    send(200, ['total' => $total, 'page' => $page, 'pages' => max(1, (int) ceil($total / $limit)), 'rows' => with_labels($rows)]);
}

function admin_request(int $id): void
{
    $r = one(request_select() . ' WHERE q.id = ?', [$id]);
    if (!$r) fail(404, 'Request not found');
    $r = with_labels([$r])[0];
    $r['services'] = $r['build_id']
        ? array_column(all(
            'SELECT s.name FROM event_build_services x JOIN services s ON s.id = x.service_id WHERE x.event_build_id = ? ORDER BY s.sort_order',
            [$r['build_id']]
        ), 'name')
        : [];
    $r['account'] = $r['user_id'] ? public_user((int) $r['user_id']) : null;
    $r['other_requests'] = (int) one('SELECT COUNT(*) n FROM quote_requests WHERE email = ? AND id <> ?', [$r['email'], $id])['n'];
    send(200, $r);
}

function admin_update_request(int $id): void
{
    $b = body();
    $sets = [];
    $params = [];
    if (array_key_exists('status', $b)) {
        if (!in_array($b['status'], STATUSES, true)) fail(422, 'Unknown status');
        $sets[] = '`status` = ?';
        $params[] = $b['status'];
    }
    if (array_key_exists('admin_notes', $b)) {
        $sets[] = 'admin_notes = ?';
        $params[] = str($b['admin_notes'], 5000);
    }
    if (!$sets) fail(422, 'Nothing to update');
    $params[] = $id;
    run('UPDATE quote_requests SET ' . implode(', ', $sets) . ' WHERE id = ?', $params);
    admin_request($id);
}

// CSV for Excel (UTF-8 with BOM so £, – and accents show correctly)
function admin_export(): void
{
    [$where, $params] = request_filters();
    $rows = with_labels(all(request_select() . "$where ORDER BY q.created_at DESC", $params));
    header_remove('Content-Type');
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="trend-events-requests-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    $cols = ['id' => 'ID', 'created_at' => 'Received', 'status' => 'Status', 'source_label' => 'From page', 'full_name' => 'Name',
        'email' => 'Email', 'phone' => 'Phone', 'event_type' => 'Event', 'event_date' => 'Event date', 'guests' => 'Guests',
        'city' => 'City', 'venue' => 'Venue', 'package' => 'Package', 'service' => 'Service', 'message' => 'Message', 'admin_notes' => 'Notes'];
    fputcsv($out, array_values($cols));
    foreach ($rows as $r) fputcsv($out, array_map(fn ($k) => $r[$k] ?? '', array_keys($cols)));
    fclose($out);
    exit;
}

// Requests that have an event date, upcoming first (?past=1 for past events)
function admin_events(): void
{
    $past = !empty($_GET['past']);
    $rows = all(
        request_select() . ' WHERE q.event_date ' . ($past ? '< CURDATE() ORDER BY q.event_date DESC' : '>= CURDATE() ORDER BY q.event_date')
        . ' LIMIT 200'
    );
    send(200, with_labels($rows));
}

function admin_users(): void
{
    send(200, all(
        'SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.created_at,
                (SELECT COUNT(*) FROM quote_requests q WHERE q.user_id = u.id OR q.email = u.email) requests,
                (SELECT COUNT(*) FROM saved_venues s WHERE s.user_id = u.id) saved
         FROM users u ORDER BY u.created_at DESC'
    ));
}

// Change role (customer/admin) or block/unblock an account
function admin_update_user(int $id): void
{
    $me = require_admin();
    $b = body();
    if ($id === (int) $me['id']) fail(422, 'You cannot change your own account here');
    if (isset($b['role'])) {
        if (!in_array($b['role'], ['customer', 'admin'], true)) fail(422, 'Unknown role');
        run('UPDATE users SET role = ? WHERE id = ?', [$b['role'], $id]);
    }
    if (isset($b['is_active'])) run('UPDATE users SET is_active = ? WHERE id = ?', [$b['is_active'] ? 1 : 0, $id]);
    admin_users();
}

function admin_saved(): void
{
    send(200, [
        'venues' => all(
            'SELECT v.slug, v.name, c.name city, COUNT(s.id) saves,
                    SUM(s.user_id IS NOT NULL) by_members, SUM(s.user_id IS NULL) by_guests
             FROM venues v JOIN cities c ON c.id = v.city_id
             LEFT JOIN saved_venues s ON s.venue_id = v.id
             GROUP BY v.id ORDER BY saves DESC, v.sort_order'
        ),
        'recent' => all(
            'SELECT s.created_at, v.name venue, u.full_name, u.email FROM saved_venues s
             JOIN venues v ON v.id = s.venue_id LEFT JOIN users u ON u.id = s.user_id
             ORDER BY s.created_at DESC LIMIT 30'
        ),
    ]);
}
