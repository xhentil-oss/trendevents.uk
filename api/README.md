# Trend Events — Database & API

## Files

| File | What it is |
|---|---|
| `database/trend_events.sql` | Full MySQL database (22 tables + all site content). Import in phpMyAdmin. |
| `database/build-sql.mjs` | Regenerates the SQL from `src/data.js` + `src/servicePages.js`: `node database/build-sql.mjs` |
| `api/config.php` | Database login + settings — **fill in on the server, never commit** (git-ignored) |
| `api/config.example.php` | Template for `config.php` |
| `api/index.php` | All API routes |
| `api/lib.php` | Helpers (validation, lookups, email, sessions) |
| `api/.htaccess` | Routes `/api/...` to `index.php`, blocks `config.php` / `lib.php` |

## Install on cPanel

1. **Create the database** — cPanel → **MySQL® Database Wizard**
   - Database: `trendevents` → cPanel names it `CPANELUSER_trendevents`
   - User: `trenduser` + a strong password → `CPANELUSER_trenduser`
   - Privileges: **ALL PRIVILEGES** → Next
2. **Import** — cPanel → **phpMyAdmin** → click the database on the left → **Import** → choose `database/trend_events.sql` → **Import**. You should see 22 tables.
3. **Upload the API** — File Manager → `public_html` → create folder `api` → upload `index.php`, `lib.php`, `config.php`, `.htaccess` (turn on *Settings → Show Hidden Files* to see `.htaccess`).
4. **Edit `public_html/api/config.php`** in File Manager (right-click → Edit):

   | Setting | Change to |
   |---|---|
   | `DB_HOST` | leave `localhost` |
   | `DB_NAME` | the full database name from step 1, e.g. `abc123_trendevents` |
   | `DB_USER` | the full user name, e.g. `abc123_trenduser` |
   | `DB_PASS` | the password from step 1 |
   | `NOTIFY_EMAIL` | where new requests are emailed (`Trendeventsuk@gmail.com`) |
   | `MAIL_FROM` | an address **on your domain**, e.g. `no-reply@trendevents.uk` (Gmail rejects mail "from" other domains) |
   | `ALLOWED_ORIGINS` | remove `http://localhost:5173` once live |
   | `DEBUG` | keep `false` |
| `SMTP_PASS` | password of the `no-reply@trendevents.uk` email account (enables SMTP via `mail.trendevents.uk:465`; empty = PHP `mail()`) |
| `SITE_URL` | `https://trendevents.uk` (used in reset links) |

5. **PHP version** — cPanel → **MultiPHP Manager** → PHP **8.0 or newer** (8.2+ recommended).
6. **Test** — open `https://yourdomain/api/` → `{"name":"Trend Events API","status":"ok"}`, then `https://yourdomain/api/services` → a list of 22 services.

The site's own `.htaccess` (from `public/`) sends unknown URLs to `index.html`; the `api/.htaccess` takes over inside `/api`, so both work together.

## Endpoints

All responses are JSON. Errors: `{"error": "...", "fields": {"email": "..."}}` with status 404 / 422 / 429 / 500.
Anywhere a value is expected you can send an **id, slug or the label the site shows** — e.g. event type `3`, `engagements`, `Engagements` or `Engagement`; guests `"100–200 guests"`; city `london` or `London`.

### Content (GET)

| Route | Notes |
|---|---|
| `/api/venues` | filters: `?category=wedding-venues` `&city=london` `&guests=100–200 guests` (or a number) |
| `/api/venues/{slug}` | with `categories` and 3 `images` |
| `/api/services` | `?category=food-decor`, `?featured=1` (the 10 Home cards in order) |
| `/api/services/{slug}` | with `tagline`, `paragraphs` (2), `features` (6), `images` (4) |
| `/api/packages` | with `items`; Custom Package has `price_from: null` |
| `/api/event-types` | `?forms=1` = only dropdown ones, in dropdown order (`form_label` is singular) |
| `/api/portfolio` | `?type=weddings` |
| `/api/settings` | phone, email, Instagram, hours, stats… |
| `/api/options` | everything the dropdowns need in one call |

### Requests (POST, JSON body)

**`/api/quote`** — Get a Quote
```json
{ "full_name": "Jane Smith", "email": "jane@example.com", "phone": "+44 7000 000000",
  "event_type": "Wedding", "event_date": "2027-06-12", "guests": "100–200 guests",
  "city": "London", "venue": "the-grand-hall", "package": "wedding-packages",
  "service": "catering", "message": "…", "source": "quote_form" }
```
Only `full_name` + `email` are required. `source` is optional — if missing it is worked out from `package` / `service` / `venue`.

**`/api/availability`** — Check Availability on a venue page (saved with `source = venue_page`)
```json
{ "full_name": "…", "email": "…", "venue": "the-grand-hall", "event_date": "2027-09-01", "guests": "50–100 guests" }
```
`venue`, a future `event_date` and `guests` are required (plus name + email, because every request needs a contact).

**`/api/build`** — Build Your Event
```json
{ "event_type": "Birthday", "city": "", "event_date": "2027-05-01", "guests": "Up to 50 guests",
  "venue": "", "services": ["flowers", "DJ & Entertainment", "cakes-and-desserts"],
  "full_name": "…", "email": "…" }
```
Empty `city` = Any, empty `venue` = To be suggested. Without name/email it is saved as a **draft**; with them it is **submitted** and a linked quote request (`source = build_page`) is created with the chosen services in the message.

Every request is emailed to `NOTIFY_EMAIL`. Spam protection: a hidden `website` field (bots fill it in → silently ignored) and max 10 requests per IP per 10 minutes.

### Accounts (session cookie)

| Route | Body |
|---|---|
| `POST /api/register` | `full_name`, `email`, `password` (8+ chars), optional `phone` |
| `POST /api/login` | `email`, `password` |
| `POST /api/logout` | — |
| `GET /api/me` | returns `{"user": …}` or `{"user": null}` |
| `POST /api/forgot-password` | `email` — emails a reset link valid 1 hour (max 3 per hour; same answer whether or not the email exists) |
| `POST /api/reset-password` | `token` (from the link), `password` — sets it, signs the user in, invalidates all other links |

Passwords are stored with `password_hash()` and checked with `password_verify()`. Call the API with `credentials: 'include'` in `fetch` so the session cookie is sent.

### Saved venues (♡)

| Route | |
|---|---|
| `GET /api/saved` | list |
| `POST /api/saved` | `{ "venue": "the-grand-hall" }` |
| `DELETE /api/saved/{slug}` | remove |

Works for a logged-in user, or for a guest who sends a random `X-Device-Token` header (16–64 letters/digits, e.g. from `crypto.randomUUID()`). When a guest logs in or registers with the same header, their saved venues move to the account.

## Making someone an admin

There is no admin panel yet. To mark a user as admin, in phpMyAdmin run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'Trendeventsuk@gmail.com';
```
New requests can be read in phpMyAdmin → `quote_requests` (newest first: sort by `created_at`), and their `status` changed to `contacted` / `quoted` / `won` / `lost`.

## Connected in the frontend

`src/api.js` calls this API. Connected so far:

| Page | Endpoint |
|---|---|
| Get a Quote (`/quote`, incl. from packages, services, consultation) | `POST /api/quote` |
| Check Availability (venue page → `/quote?request=availability`) | `POST /api/availability` |
| Build Your Event → Get a Quote (`/quote?from=build`) | `POST /api/build` |
| Account (sign in / create account / sign out / forgot password), `/reset-password` page | `POST /api/login`, `/register`, `/logout`, `GET /api/me` |
| Saved venues ♡ (header count, Saved page, hearts on venue cards) | `GET/POST /api/saved`, `DELETE /api/saved/{slug}` |

Still using the built-in data (no API call): venue/service/package lists.

Saved venues: guests are identified by a random `X-Device-Token` (stored in the browser as `trend:device`); signing in moves that device's saves into the account, so the list follows the user to any device.

**Local development:** the Vite dev server has no PHP, so forms show "We could not reach the server". To test against the live API run:
`API_PROXY=https://trendevents.uk npm run dev` (in PowerShell: `$env:API_PROXY="https://trendevents.uk"; npm run dev`).

## Admin dashboard (`/admin`)

`https://trendevents.uk/admin` — sign in with an account whose `role` is `admin`:
```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```
Tabs: Overview (stats, latest requests, next events), Requests (filter, search, details, status, internal notes, delete, CSV export), Events (requests with an event date, by month), Users (role, block/unblock), Saved venues.

Routes (`api/admin.php`, all require an admin session — 401 / 403 otherwise):
`GET admin/stats` · `GET admin/requests?status=&source=&q=&page=` · `GET admin/requests/{id}` · `POST admin/requests/{id}` `{status, admin_notes}` · `DELETE admin/requests/{id}` · `GET admin/export` (CSV, same filters) · `GET admin/events[?past=1]` · `GET admin/users` · `POST admin/users/{id}` `{role, is_active}` · `GET admin/saved`
