<?php
// ============================================================
//  Trend Events API — configuration (EXAMPLE: copy to config.php and fill in)
//  Fill in the values from cPanel → MySQL® Databases.
//  This file is blocked from the web by api/.htaccess.
// ============================================================

// cPanel prefixes database and user names with your account name, e.g. "abc123_trendevents"
const DB_HOST = 'localhost';
const DB_NAME = 'CPANELUSER_trendevents';
const DB_USER = 'CPANELUSER_trenduser';
const DB_PASS = 'CHANGE_ME';

// Where new quote / availability / build requests are emailed ('' = don't send)
const NOTIFY_EMAIL = 'Trendeventsuk@gmail.com';
// Sender address for those emails — use an address on your own domain, e.g. no-reply@trendevents.uk
const MAIL_FROM = 'no-reply@trendevents.uk';

// Outgoing mail server (cPanel → Email Accounts → no-reply → Connect Devices).
// Leave SMTP_PASS empty to fall back to PHP mail().
const SMTP_HOST = 'mail.trendevents.uk';
const SMTP_PORT = 465;                       // 465 = SSL, 587 = STARTTLS
const SMTP_USER = 'no-reply@trendevents.uk';
const SMTP_PASS = '';                        // password of the no-reply email account
const SMTP_VERIFY_SSL = true;                // set false only if the mail server's certificate doesn't match SMTP_HOST

// Public address of the site — used in password reset links
const SITE_URL = 'https://trendevents.uk';

// Extra origins allowed to call the API (the live site itself never needs this).
// Keep the Vite dev server here while developing; remove it once the site is live.
const ALLOWED_ORIGINS = ['http://localhost:5173'];

// true shows error details in API responses — keep false on the live site
const DEBUG = false;

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
    return $pdo;
}
