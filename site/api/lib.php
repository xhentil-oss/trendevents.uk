<?php
// Shared helpers for the Trend Events API

function send(int $status, $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(int $status, string $message, array $fields = []): void
{
    send($status, ['error' => $message] + ($fields ? ['fields' => $fields] : []));
}

// JSON body (or classic form post)
function body(): array
{
    static $data = null;
    if ($data === null) {
        $raw = file_get_contents('php://input');
        $data = $raw !== '' ? json_decode($raw, true) : $_POST;
        if (!is_array($data)) fail(400, 'Invalid JSON body');
    }
    return $data;
}

function str($value, int $max = 255): ?string
{
    if ($value === null) return null;
    $value = trim((string) $value);
    return $value === '' ? null : mb_substr($value, 0, $max);
}

function valid_date(?string $d): ?string
{
    if ($d === null) return null;
    $dt = DateTime::createFromFormat('Y-m-d', $d);
    return $dt && $dt->format('Y-m-d') === $d ? $d : null;
}

function all(string $sql, array $params = []): array
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st->fetchAll();
}

function one(string $sql, array $params = []): ?array
{
    $st = db()->prepare($sql);
    $st->execute($params);
    $row = $st->fetch();
    return $row ?: null;
}

function run(string $sql, array $params = []): int
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return (int) db()->lastInsertId();
}

// ---------- lookups: accept an id, a slug, or the label the site shows ----------

function lookup_id(string $table, $value, array $columns): ?int
{
    if ($value === null || $value === '') return null;
    if (is_int($value) || ctype_digit((string) $value)) {
        $row = one("SELECT id FROM $table WHERE id = ?", [(int) $value]);
        return $row ? (int) $row['id'] : null;
    }
    $where = implode(' OR ', array_map(fn ($c) => "$c = ?", $columns));
    $row = one("SELECT id FROM $table WHERE $where LIMIT 1", array_fill(0, count($columns), (string) $value));
    return $row ? (int) $row['id'] : null;
}

// "Wedding", "Weddings" or "weddings" all resolve to the same event type
function event_type_id($v): ?int { return lookup_id('event_types', $v, ['slug', 'name', 'form_label']); }
function city_id($v): ?int { return lookup_id('cities', $v, ['slug', 'name']); }
function guest_range_id($v): ?int { return lookup_id('guest_ranges', $v, ['label']); }
function venue_id($v): ?int { return lookup_id('venues', $v, ['slug']); }
function package_id($v): ?int { return lookup_id('packages', $v, ['slug']); }
function service_id($v): ?int { return lookup_id('services', $v, ['slug', 'name']); }

// Rejects a filled-in value that doesn't match anything, instead of silently storing NULL
function resolve(array $b, string $key, callable $fn, array &$errors): ?int
{
    if (!isset($b[$key]) || $b[$key] === '' || $b[$key] === null) return null;
    $id = $fn($b[$key]);
    if ($id === null) $errors[$key] = 'Unknown value';
    return $id;
}

// ---------- contact fields shared by quote / availability / build ----------

function contact(array $b): array
{
    $errors = [];
    $name = str($b['full_name'] ?? $b['name'] ?? null, 150);
    $email = str($b['email'] ?? null, 190);
    if (!$name || mb_strlen($name) < 2) $errors['full_name'] = 'Please enter your full name';
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address';
    $phone = str($b['phone'] ?? null, 30);
    if ($phone !== null && !preg_match('/^[0-9+()\s.-]{6,30}$/', $phone)) $errors['phone'] = 'Please enter a valid phone number';
    return [$errors, ['full_name' => $name, 'email' => $email, 'phone' => $phone]];
}

// Spam trap: the real forms never fill a field called "website"
function honeypot(array $b): void
{
    if (!empty($b['website'])) send(201, ['ok' => true]);
}

// Max 10 submissions per IP per 10 minutes
function rate_limit(): void
{
    $row = one('SELECT COUNT(*) n FROM quote_requests WHERE ip_address = ? AND created_at > (NOW() - INTERVAL 10 MINUTE)', [client_ip()]);
    if ($row && (int) $row['n'] >= 10) fail(429, 'Too many requests, please try again later');
}

function client_ip(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
}

function notify(string $subject, array $lines): void
{
    if (NOTIFY_EMAIL === '') return;
    $text = implode("\n", array_map(fn ($k, $v) => "$k: $v", array_keys($lines), $lines));
    send_mail(NOTIFY_EMAIL, $subject, $text, request_email_html($subject, $lines), $lines['Email'] ?? null);
}

// The team's copy of a request: every form field in a table, plus reply / call buttons
function request_email_html(string $subject, array $lines): string
{
    $e = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
    $message = $lines['Message'] ?? null;
    unset($lines['Message']);

    $rows = '';
    foreach ($lines as $label => $value) {
        if ($label === 'Email') {
            $value = '<a href="mailto:' . $e($value) . '" style="color:#a8834a">' . $e($value) . '</a>';
        } elseif ($label === 'Phone') {
            $value = '<a href="tel:' . $e(preg_replace('/[^0-9+]/', '', $value)) . '" style="color:#a8834a">' . $e($value) . '</a>';
        } else {
            $value = $e($value);
        }
        $rows .= '<tr>'
            . '<td style="padding:11px 14px;border-bottom:1px solid #eee5d8;width:130px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a8279;vertical-align:top">' . $e($label) . '</td>'
            . '<td style="padding:11px 14px;border-bottom:1px solid #eee5d8;font-size:15px;color:#1d1915">' . $value . '</td>'
            . '</tr>';
    }

    $messageBlock = $message
        ? '<p style="margin:26px 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a8279">Tell us about your event</p>'
          . '<div style="padding:16px 18px;background:#f6f1ea;border-left:3px solid #bf9a5e;font-size:15px;line-height:1.6;color:#1d1915;white-space:pre-wrap">' . $e($message) . '</div>'
        : '';

    $buttons = '';
    if (!empty($lines['Email'])) {
        $buttons .= '<a href="mailto:' . $e($lines['Email']) . '?subject=' . rawurlencode('Re: your Trend Events request') . '" style="display:inline-block;margin:0 8px 8px 0;background:#bf9a5e;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:3px;font-size:12px;letter-spacing:2px;text-transform:uppercase">Reply to client</a>';
    }
    if (!empty($lines['Phone'])) {
        $buttons .= '<a href="tel:' . $e(preg_replace('/[^0-9+]/', '', $lines['Phone'])) . '" style="display:inline-block;margin:0 8px 8px 0;border:1px solid #bf9a5e;color:#a8834a;text-decoration:none;padding:12px 22px;border-radius:3px;font-size:12px;letter-spacing:2px;text-transform:uppercase">Call</a>';
    }

    return '<!doctype html><html><body style="margin:0;background:#f6f1ea;font-family:Helvetica,Arial,sans-serif;color:#1d1915">'
        . '<table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">'
        . '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:8px;overflow:hidden">'
        . '<tr><td style="background:#0f0d0b;padding:20px 28px;color:#c9a566;font-family:Georgia,serif;font-size:20px;letter-spacing:3px">TREND EVENTS</td></tr>'
        . '<tr><td style="padding:28px">'
        . '<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a8834a">New request</p>'
        . '<h1 style="margin:0 0 22px;font-family:Georgia,serif;font-weight:normal;font-size:24px;line-height:1.3">' . $e($subject) . '</h1>'
        . '<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee5d8">' . $rows . '</table>'
        . $messageBlock
        . ($buttons ? '<div style="margin-top:26px">' . $buttons . '</div>' : '')
        . '<p style="margin:22px 0 0;font-size:12px;color:#8a8279">Received ' . $e(date('j M Y, H:i')) . ' · also saved in phpMyAdmin → quote_requests</p>'
        . '</td></tr></table></td></tr></table></body></html>';
}

// ---------- email ----------

// Settings added after the first release: defaults keep an older config.php working
function cfg(string $name, $default)
{
    return defined($name) ? constant($name) : $default;
}

// Sends through SMTP when SMTP_PASS is set in config.php, otherwise falls back to PHP mail()
function send_mail(string $to, string $subject, string $text, ?string $html = null, ?string $replyTo = null): bool
{
    $boundary = 'b' . bin2hex(random_bytes(12));
    $from = MAIL_FROM;
    $headers = [
        'Date: ' . date('r'),
        'From: Trend Events <' . $from . '>',
        'To: <' . $to . '>',
        'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . substr(strrchr($from, '@'), 1) . '>',
        'MIME-Version: 1.0',
    ];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: <' . $replyTo . '>';

    if ($html === null) {
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: base64';
        $body = chunk_split(base64_encode($text));
    } else {
        $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
        $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($text))
            . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($html))
            . "--$boundary--\r\n";
    }

    if (cfg('SMTP_PASS', '') === '') {
        // mail() takes To and Subject separately
        $extra = array_filter($headers, fn ($h) => !preg_match('/^(To|Subject):/', $h));
        return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $extra));
    }

    try {
        smtp_send($to, implode("\r\n", $headers) . "\r\n\r\n" . $body);
        return true;
    } catch (Throwable $e) {
        error_log('Trend API mail error: ' . $e->getMessage());
        return false;
    }
}

// Minimal SMTP client: port 465 = SSL, 587 = STARTTLS, anything else = plain (local testing)
function smtp_send(string $to, string $message): void
{
    $host = cfg('SMTP_HOST', 'mail.trendevents.uk');
    $port = (int) cfg('SMTP_PORT', 465);
    $ctx = stream_context_create(['ssl' => [
        'verify_peer' => cfg('SMTP_VERIFY_SSL', true),
        'verify_peer_name' => cfg('SMTP_VERIFY_SSL', true),
        'peer_name' => $host,
    ]]);
    $scheme = $port === 465 ? 'ssl' : 'tcp';
    $fp = @stream_socket_client("$scheme://$host:$port", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
    stream_set_timeout($fp, 20);

    $read = function () use ($fp): string {
        $out = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $out .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') break; // last line of a (multi-line) reply
        }
        return $out;
    };
    $cmd = function (?string $line, array $expect) use ($fp, $read): string {
        if ($line !== null) fwrite($fp, $line . "\r\n");
        $reply = $read();
        if (!in_array((int) substr($reply, 0, 3), $expect, true)) {
            throw new RuntimeException('SMTP error after "' . explode(' ', (string) $line)[0] . '": ' . trim($reply));
        }
        return $reply;
    };

    $hostname = $_SERVER['SERVER_NAME'] ?? 'trendevents.uk';
    $cmd(null, [220]);
    $cmd("EHLO $hostname", [250]);
    if ($port === 587) {
        $cmd('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new RuntimeException('STARTTLS failed');
        $cmd("EHLO $hostname", [250]);
    }
    $cmd('AUTH LOGIN', [334]);
    $cmd(base64_encode(cfg('SMTP_USER', MAIL_FROM)), [334]);
    $cmd(base64_encode(cfg('SMTP_PASS', '')), [235]);
    $cmd('MAIL FROM:<' . MAIL_FROM . '>', [250]);
    $cmd('RCPT TO:<' . $to . '>', [250, 251]);
    $cmd('DATA', [354]);
    // Dot-stuffing: a line starting with "." must be sent as ".."
    $data = preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], ["\n", "\r\n"], $message));
    $cmd($data . "\r\n.", [250]);
    fwrite($fp, "QUIT\r\n");
    fclose($fp);
}

// Simple branded HTML email with one button
function email_html(string $title, string $intro, string $buttonText, string $url, string $footer): string
{
    $e = fn ($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    return '<!doctype html><html><body style="margin:0;background:#f6f1ea;font-family:Helvetica,Arial,sans-serif;color:#1d1915">'
        . '<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">'
        . '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden">'
        . '<tr><td style="background:#0f0d0b;padding:22px 28px;color:#c9a566;font-family:Georgia,serif;font-size:22px;letter-spacing:3px">TREND EVENTS</td></tr>'
        . '<tr><td style="padding:32px 28px">'
        . '<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-weight:normal;font-size:26px">' . $e($title) . '</h1>'
        . '<p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:#5b544c">' . $e($intro) . '</p>'
        . '<a href="' . $e($url) . '" style="display:inline-block;background:#bf9a5e;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:3px;font-size:13px;letter-spacing:2px;text-transform:uppercase">' . $e($buttonText) . '</a>'
        . '<p style="margin:26px 0 0;font-size:12px;line-height:1.6;color:#8a8279">' . $e($footer) . '<br><a href="' . $e($url) . '" style="color:#a8834a;word-break:break-all">' . $e($url) . '</a></p>'
        . '</td></tr></table></td></tr></table></body></html>';
}

// Saves a quote request and emails the team; returns the new id
function save_quote(array $contact, array $fields, string $source): int
{
    $data = $contact + $fields + ['source' => $source, 'user_id' => current_user_id(), 'ip_address' => client_ip()];
    $cols = array_keys($data);
    $id = run(
        'INSERT INTO quote_requests (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')',
        array_values($data)
    );
    $summary = one(
        'SELECT q.full_name, q.email, q.phone, q.event_date, q.message, q.source,
                et.form_label event_type, gr.label guests, c.name city, v.name venue, p.name package, s.name service
         FROM quote_requests q
         LEFT JOIN event_types et ON et.id = q.event_type_id
         LEFT JOIN guest_ranges gr ON gr.id = q.guest_range_id
         LEFT JOIN cities c ON c.id = q.city_id
         LEFT JOIN venues v ON v.id = q.venue_id
         LEFT JOIN packages p ON p.id = q.package_id
         LEFT JOIN services s ON s.id = q.service_id
         WHERE q.id = ?',
        [$id]
    );
    $pages = ['quote_form' => 'Get a Quote', 'venue_page' => 'Check Availability', 'package_page' => 'Package quote',
        'service_page' => 'Service quote', 'build_page' => 'Build Your Event', 'homepage_search' => 'Homepage search'];
    $summary['source'] = $pages[$summary['source']] ?? $summary['source'];
    notify(($summary['event_type'] ? $summary['event_type'] . ' request' : 'New request') . " #$id — " . $contact['full_name'], array_filter([
        'Full name' => $summary['full_name'], 'Email' => $summary['email'], 'Phone' => $summary['phone'],
        'Event type' => $summary['event_type'],
        'Event date' => $summary['event_date'] ? date('j F Y', strtotime($summary['event_date'])) : null,
        'Guests' => $summary['guests'],
        'City' => $summary['city'], 'Venue' => $summary['venue'], 'Package' => $summary['package'],
        'Service' => $summary['service'], 'Message' => $summary['message'], 'From page' => $summary['source'],
    ]));
    return $id;
}

// ---------- sessions & auth ----------

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 30,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('trend_session');
    session_start();
}

function current_user_id(): ?int
{
    start_session();
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function public_user(int $id): ?array
{
    return one('SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ? AND is_active = 1', [$id]);
}

// Guests without an account identify their saved list with a random device token (X-Device-Token header)
function device_token(): ?string
{
    $t = $_SERVER['HTTP_X_DEVICE_TOKEN'] ?? ($_GET['device_token'] ?? (body()['device_token'] ?? null));
    return is_string($t) && preg_match('/^[A-Za-z0-9_-]{16,64}$/', $t) ? $t : null;
}
