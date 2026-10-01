// Generates database/trend_events.sql from the site's own data (src/data.js, src/servicePages.js)
// so texts and image paths always match the frontend. Run:  node database/build-sql.mjs
import { mkdtempSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Load the frontend data modules read-only (copied to a temp dir so the extension-less import resolves in Node)
const tmp = mkdtempSync(join(tmpdir(), 'trend-sql-'))
cpSync(join(root, 'src/data.js'), join(tmp, 'data.js'))
writeFileSync(join(tmp, 'servicePages.js'), readFileSync(join(root, 'src/servicePages.js'), 'utf8').replace("from './data'", "from './data.js'"))
const D = await import(pathToFileURL(join(tmp, 'data.js')))
const { SERVICE_PAGES } = await import(pathToFileURL(join(tmp, 'servicePages.js')))

// Image values in the code are local paths ("/images/...") or Unsplash ids → store a usable URL/path
const imgPath = (v) => (v ? D.img(v, 1600) : null)

// ---------- SQL helpers ----------
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`)
const out = []
const sql = (s) => out.push(s)
const insert = (table, cols, rows) => {
  if (!rows.length) return
  sql(`INSERT INTO ${table} (${cols.join(', ')}) VALUES\n` + rows.map((r) => '(' + r.map(q).join(', ') + ')').join(',\n') + ';\n')
}
const counts = {}
const count = (t, n) => (counts[t] = (counts[t] || 0) + n)
const fail = (msg) => {
  throw new Error('VERIFY FAILED: ' + msg)
}

// ---------- 1. cities / 2. guest ranges ----------
const CITIES = D.LOCATIONS
const GUESTS = [
  ['Up to 50 guests', 0, 50],
  ['50–100 guests', 50, 100],
  ['100–200 guests', 100, 200],
  ['200–400 guests', 200, 400],
  ['400+ guests', 400, null],
]
GUESTS.forEach(([label]) => D.GUEST_OPTIONS.includes(label) || fail(`guest range "${label}" not in code`))

// ---------- 3. event types (spec from the prompt; texts/images from code) ----------
const EVENTS = [
  ['weddings', 'Weddings', 'Wedding', 50, 500, 1],
  ['birthdays', 'Birthdays', 'Birthday', 20, 250, 1],
  ['engagements', 'Engagements', 'Engagement', 2, 200, 1],
  ['baby-showers', 'Baby Showers', 'Baby Shower', 15, 100, 1],
  ['private-parties', 'Private Parties', 'Private Party', 10, 300, 1],
  ['corporate-events', 'Corporate Events', 'Corporate Event', 30, 1000, 1],
  ['conferences', 'Conferences', 'Conference', 50, 2000, 1],
  ['product-launches', 'Product Launches', 'Product Launch', 50, 800, 1],
  ['award-nights', 'Award Nights', 'Award Night', 100, 1000, 0],
  ['christmas-parties', 'Christmas Parties', 'Christmas Party', 20, 1000, 1],
  ['brand-events', 'Brand Events', 'Brand Event', null, null, 0],
]
const eventRows = EVENTS.map(([slug, name, label, min, max, forms], i) => {
  const e = D.EVENT_TYPES.find((x) => x.name === name) || fail(`event ${name} missing in code`)
  const d = D.EVENT_DETAILS[name] || fail(`event details ${name} missing in code`)
  if (D.slug(name) !== slug) fail(`slug mismatch ${name}`)
  return { slug, name, label, tagline: e.text, description: d.intro, min, max, image: imgPath(e.image), forms, sort: i + 1, features: d.includes }
})
eventRows.push({ slug: 'other', name: 'Other Event', label: 'Other Event', tagline: null, description: null, min: null, max: null, image: null, forms: 1, sort: 12, features: [] })
const eventId = Object.fromEntries(eventRows.map((e, i) => [e.name, i + 1]))

// Form dropdown order must match the site's SEARCH_EVENT_TYPES
const formLabels = eventRows.filter((e) => e.forms).map((e) => e.label)
if (formLabels.join('|') !== D.SEARCH_EVENT_TYPES.join('|')) fail(`form dropdown order ${formLabels} ≠ ${D.SEARCH_EVENT_TYPES}`)

// ---------- 4/5. service categories + services (22, spec from the prompt) ----------
const CATS = [
  ['planning-design', 'Planning & Design'],
  ['food-decor', 'Food & Décor'],
  ['photo-entertainment', 'Photo & Entertainment'],
  ['event-production', 'Event Production'],
]
// slug, name, category index, short description (card text)
const SERVICES = [
  ['event-planning', 'Full Event Planning', 1, 'Full planning, coordination & concept design'],
  ['event-coordination', 'Event Coordination', 1, 'On-the-day management so you can relax'],
  ['event-concept-and-design', 'Event Concept & Design', 1, 'A creative vision built around you'],
  ['venue-finding', 'Venue Finding', 1, 'The perfect space, sourced for you'],
  ['event-styling', 'Event Styling', 1, 'Every detail styled to your taste'],
  ['catering', 'Catering', 2, 'Exquisite menus for every occasion'],
  ['decoration', 'Decoration', 2, 'Bespoke styling & floral designs'],
  ['flowers', 'Flowers', 2, 'Florals arranged by expert designers'],
  ['cakes-and-desserts', 'Cakes & Desserts', 2, 'Showstopping cakes and dessert tables'],
  ['table-styling', 'Table Styling', 2, 'Tablescapes that set the mood'],
  ['photography', 'Photography', 3, 'Capture every moment'],
  ['videography', 'Videography', 3, 'Cinematic event films'],
  ['dj-and-entertainment', 'DJ & Entertainment', 3, 'Music and entertainment for every vibe'],
  ['live-music', 'Live Music', 3, 'Bands, singers and soloists'],
  ['entertainment', 'Entertainment', 3, 'Performers that wow your guests'],
  ['sound', 'Sound', 4, 'Professional audio for any space'],
  ['lighting', 'Lighting', 4, 'Lighting design that transforms a room'],
  ['sound-and-lighting', 'Sound & Lighting', 4, 'Professional audio and lighting production'],
  ['led-screens', 'LED Screens', 4, 'Stunning visuals for bigger impact'],
  ['stages', 'Stages', 4, 'Decorated stages & backdrops'],
  ['special-effects', 'Special Effects', 4, 'Create unforgettable moments'],
  ['technical-production', 'Technical Production', 4, 'End-to-end technical delivery'],
]
// Home cards, in display order (Sections.jsx CARD_ORDER)
const FEATURED = ['event-planning', 'decoration', 'catering', 'photography', 'videography', 'dj-and-entertainment', 'sound-and-lighting', 'led-screens', 'stages', 'special-effects']
const featuredCard = Object.fromEntries(D.FEATURED_SERVICES.map((s) => [D.slug(s.name), s]))
const serviceRows = SERVICES.map(([slug, name, cat, short], i) => {
  const p = SERVICE_PAGES[slug] || fail(`service page ${slug} missing in code`)
  if (p.intro.length !== 2) fail(`${slug} should have 2 paragraphs`)
  if (p.includes.length !== 6) fail(`${slug} should have 6 features`)
  if (p.gallery.length !== 4) fail(`${slug} should have 4 photos`)
  const fi = FEATURED.indexOf(slug)
  const card = featuredCard[slug]
  if (card && card.text !== short) fail(`${slug} card text "${card.text}" ≠ "${short}"`)
  return {
    slug, name, cat, short, tagline: p.tagline, long: p.intro.join('\n\n'),
    image: imgPath(card ? card.image : p.gallery[0]),
    featured: fi >= 0 ? 1 : 0, sort: fi >= 0 ? fi + 1 : 100 + i, features: p.includes, gallery: p.gallery,
  }
})
if (Object.keys(SERVICE_PAGES).length !== 22) fail(`code has ${Object.keys(SERVICE_PAGES).length} service pages, expected 22`)
const serviceId = Object.fromEntries(serviceRows.map((s, i) => [s.slug, i + 1]))

// ---------- 6/7. venue categories + venues ----------
const venueCats = D.VENUE_CATEGORIES
const venueCatId = Object.fromEntries(venueCats.map((c, i) => [c, i + 1]))
const EXPECTED_VENUE_CATS = { 'the-grand-hall': 5, 'riverside-terrace': 5, 'the-crystal-room': 4, 'skyline-view': 5, 'the-garden-estate': 4, 'the-summit-centre': 3, 'the-loft-kitchen': 4, 'azure-bay-resort': 4 }
D.VENUES.forEach((v) => {
  if (EXPECTED_VENUE_CATS[v.id] !== v.categories.length) fail(`${v.id} has ${v.categories.length} categories`)
  if (v.gallery.length !== 3) fail(`${v.id} should have 3 photos`)
})

// ---------- 8. packages (custom package gets the 4th item from the prompt) ----------
const packageRows = D.PACKAGES.map((p, i) => ({
  slug: D.slug(p.name), name: p.name, text: p.text, price: p.from, popular: p.featured ? 1 : 0, image: imgPath(p.image), sort: i + 1,
  items: p.name === 'Custom Package' ? [...p.includes, 'Tailored price'] : p.includes,
}))

// ---------- 9. portfolio ----------
const portfolioRows = D.PORTFOLIO.map((p, i) => ({
  slug: D.slug(p.title), title: p.title, type: eventId[p.type] || fail(`portfolio type ${p.type}`), image: imgPath(p.image), sort: i + 1,
}))

// =====================================================================
//  WRITE SQL
// =====================================================================
sql(`-- =====================================================================
--  TREND EVENTS — MySQL database
--  Generated by database/build-sql.mjs from the website data (src/data.js,
--  src/servicePages.js) — texts and image paths match the frontend exactly.
--  MySQL 5.7+ / MariaDB 10.3+ · InnoDB · utf8mb4_unicode_ci · phpMyAdmin ready
--
--  Image columns hold either a site path ("/images/...") or a full URL.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS password_resets, event_build_services, event_builds, quote_requests, saved_venues, users,
  portfolio_images, portfolio_items, package_items, packages, venue_images, venue_category_map,
  venues, venue_categories, service_images, service_features, services, service_categories,
  event_type_features, event_types, guest_ranges, cities, site_settings;
`)

const T = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'

sql(`-- 1. CITIES
CREATE TABLE cities (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cities_slug (slug)
) ${T}
`)
insert('cities', ['id', 'name', 'slug', 'sort_order'], CITIES.map((c, i) => [i + 1, c, D.slug(c), i + 1]))
count('cities', CITIES.length)

sql(`-- 2. GUEST RANGES ("Number of guests" dropdown; max NULL = no limit)
CREATE TABLE guest_ranges (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  label      VARCHAR(50) NOT NULL,
  min_guests INT NOT NULL DEFAULT 0,
  max_guests INT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guest_ranges_label (label)
) ${T}
`)
insert('guest_ranges', ['id', 'label', 'min_guests', 'max_guests', 'sort_order'], GUESTS.map(([l, a, b], i) => [i + 1, l, a, b, i + 1]))
count('guest_ranges', GUESTS.length)

sql(`-- 3. EVENT TYPES — name is plural (sections, Our Work filter), form_label is singular (dropdowns)
CREATE TABLE event_types (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(120) NOT NULL,
  name          VARCHAR(150) NOT NULL,
  form_label    VARCHAR(150) NOT NULL,
  tagline       VARCHAR(255) NULL,
  description   TEXT NULL,
  min_guests    INT NULL,
  max_guests    INT NULL,
  image         VARCHAR(255) NULL,
  show_in_forms TINYINT(1) NOT NULL DEFAULT 1,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_event_types_slug (slug),
  KEY idx_event_types_forms (show_in_forms, sort_order)
) ${T}

CREATE TABLE event_type_features (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type_id INT UNSIGNED NOT NULL,
  feature       VARCHAR(255) NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_etf_event_type (event_type_id, sort_order),
  CONSTRAINT fk_etf_event_type FOREIGN KEY (event_type_id) REFERENCES event_types (id) ON DELETE CASCADE
) ${T}
`)
insert('event_types', ['id', 'slug', 'name', 'form_label', 'tagline', 'description', 'min_guests', 'max_guests', 'image', 'show_in_forms', 'sort_order'],
  eventRows.map((e, i) => [i + 1, e.slug, e.name, e.label, e.tagline, e.description, e.min, e.max, e.image, e.forms, e.sort]))
count('event_types', eventRows.length)
const etf = eventRows.flatMap((e, i) => e.features.map((f, j) => [i + 1, f, j + 1]))
insert('event_type_features', ['event_type_id', 'feature', 'sort_order'], etf)
count('event_type_features', etf.length)

sql(`-- 4. SERVICE CATEGORIES
CREATE TABLE service_categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(120) NOT NULL,
  name       VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_service_categories_slug (slug)
) ${T}
`)
insert('service_categories', ['id', 'slug', 'name', 'sort_order'], CATS.map(([s, n], i) => [i + 1, s, n, i + 1]))
count('service_categories', CATS.length)

sql(`-- 5. SERVICES — slug = URL /services/<slug>; is_featured = the 10 Home cards (sort_order 1–10)
CREATE TABLE services (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id       INT UNSIGNED NOT NULL,
  slug              VARCHAR(120) NOT NULL,
  name              VARCHAR(150) NOT NULL,
  short_description VARCHAR(255) NULL,
  tagline           VARCHAR(255) NULL,
  long_description  TEXT NULL,
  image             VARCHAR(255) NULL,
  is_featured       TINYINT(1) NOT NULL DEFAULT 0,
  sort_order        INT NOT NULL DEFAULT 0,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_slug (slug),
  KEY idx_services_category (category_id),
  KEY idx_services_featured (is_featured, sort_order),
  CONSTRAINT fk_services_category FOREIGN KEY (category_id) REFERENCES service_categories (id) ON DELETE RESTRICT
) ${T}

CREATE TABLE service_features (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_id INT UNSIGNED NOT NULL,
  feature    VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sf_service (service_id, sort_order),
  CONSTRAINT fk_sf_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ${T}

CREATE TABLE service_images (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text   VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_si_service (service_id, sort_order),
  CONSTRAINT fk_si_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
) ${T}
`)
insert('services', ['id', 'category_id', 'slug', 'name', 'short_description', 'tagline', 'long_description', 'image', 'is_featured', 'sort_order'],
  serviceRows.map((s, i) => [i + 1, s.cat, s.slug, s.name, s.short, s.tagline, s.long, s.image, s.featured, s.sort]))
count('services', serviceRows.length)
const sf = serviceRows.flatMap((s, i) => s.features.map((f, j) => [i + 1, f, j + 1]))
insert('service_features', ['service_id', 'feature', 'sort_order'], sf)
count('service_features', sf.length)
const si = serviceRows.flatMap((s, i) => s.gallery.map((g, j) => [i + 1, imgPath(g), `${s.name} ${j + 1}`, j + 1]))
insert('service_images', ['service_id', 'image_path', 'alt_text', 'sort_order'], si)
count('service_images', si.length)

sql(`-- 6. VENUE CATEGORIES
CREATE TABLE venue_categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(120) NOT NULL,
  name       VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venue_categories_slug (slug)
) ${T}
`)
insert('venue_categories', ['id', 'slug', 'name', 'sort_order'], venueCats.map((c, i) => [i + 1, D.slug(c), c, i + 1]))
count('venue_categories', venueCats.length)

sql(`-- 7. VENUES — slug = URL /venues/<slug>
CREATE TABLE venues (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(120) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  city_id     INT UNSIGNED NOT NULL,
  capacity    INT NOT NULL,
  price_from  DECIMAL(10,2) NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'GBP',
  description TEXT NULL,
  address     VARCHAR(255) NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venues_slug (slug),
  KEY idx_venues_city (city_id),
  KEY idx_venues_capacity (capacity),
  CONSTRAINT fk_venues_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE RESTRICT
) ${T}

CREATE TABLE venue_category_map (
  venue_id    INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (venue_id, category_id),
  KEY idx_vcm_category (category_id),
  CONSTRAINT fk_vcm_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
  CONSTRAINT fk_vcm_category FOREIGN KEY (category_id) REFERENCES venue_categories (id) ON DELETE CASCADE
) ${T}

CREATE TABLE venue_images (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venue_id   INT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text   VARCHAR(255) NULL,
  is_cover   TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_vi_venue (venue_id, sort_order),
  CONSTRAINT fk_vi_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ${T}
`)
insert('venues', ['id', 'slug', 'name', 'city_id', 'capacity', 'price_from', 'currency', 'description', 'is_featured', 'sort_order'],
  D.VENUES.map((v, i) => [i + 1, v.id, v.name, CITIES.indexOf(v.location) + 1, v.capacity, v.price, 'GBP', v.description, 1, i + 1]))
count('venues', D.VENUES.length)
const vcm = D.VENUES.flatMap((v, i) => v.categories.map((c) => [i + 1, venueCatId[c] || fail(`venue category ${c}`)]))
insert('venue_category_map', ['venue_id', 'category_id'], vcm)
count('venue_category_map', vcm.length)
const vi = D.VENUES.flatMap((v, i) => v.gallery.map((g, j) => [i + 1, imgPath(g), `${v.name} ${j + 1}`, g === v.image ? 1 : 0, j + 1]))
insert('venue_images', ['venue_id', 'image_path', 'alt_text', 'is_cover', 'sort_order'], vi)
count('venue_images', vi.length)

sql(`-- 8. PACKAGES — price_from NULL = tailored price (Custom Package → Build Your Event)
CREATE TABLE packages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(120) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  price_from  DECIMAL(10,2) NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'GBP',
  image       VARCHAR(255) NULL,
  is_popular  TINYINT(1) NOT NULL DEFAULT 0,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_packages_slug (slug)
) ${T}

CREATE TABLE package_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  package_id INT UNSIGNED NOT NULL,
  item       VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_pi_package (package_id, sort_order),
  CONSTRAINT fk_pi_package FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE CASCADE
) ${T}
`)
insert('packages', ['id', 'slug', 'name', 'description', 'price_from', 'currency', 'image', 'is_popular', 'sort_order'],
  packageRows.map((p, i) => [i + 1, p.slug, p.name, p.text, p.price, 'GBP', p.image, p.popular, p.sort]))
count('packages', packageRows.length)
const pi = packageRows.flatMap((p, i) => p.items.map((it, j) => [i + 1, it, j + 1]))
insert('package_items', ['package_id', 'item', 'sort_order'], pi)
count('package_items', pi.length)

sql(`-- 9. PORTFOLIO (Our Work)
CREATE TABLE portfolio_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(150) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  event_type_id INT UNSIGNED NOT NULL,
  description   TEXT NULL,
  cover_image   VARCHAR(255) NULL,
  event_date    DATE NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_portfolio_slug (slug),
  KEY idx_portfolio_event_type (event_type_id),
  CONSTRAINT fk_portfolio_event_type FOREIGN KEY (event_type_id) REFERENCES event_types (id) ON DELETE RESTRICT
) ${T}

CREATE TABLE portfolio_images (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  portfolio_id INT UNSIGNED NOT NULL,
  image_path   VARCHAR(255) NOT NULL,
  alt_text     VARCHAR(255) NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_pimg_portfolio (portfolio_id, sort_order),
  CONSTRAINT fk_pimg_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolio_items (id) ON DELETE CASCADE
) ${T}
`)
insert('portfolio_items', ['id', 'slug', 'title', 'event_type_id', 'cover_image', 'sort_order'],
  portfolioRows.map((p, i) => [i + 1, p.slug, p.title, p.type, p.image, p.sort]))
count('portfolio_items', portfolioRows.length)
const pimg = portfolioRows.map((p, i) => [i + 1, p.image, p.title, 1])
insert('portfolio_images', ['portfolio_id', 'image_path', 'alt_text', 'sort_order'], pimg)
count('portfolio_images', pimg.length)

sql(`-- 10. USERS (Account page) — passwords stored with PHP password_hash()
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  phone         VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ${T}

-- Password reset links (token stored as SHA-256 hash, valid 1 hour)
CREATE TABLE password_resets (
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
) ${T}

-- 11. SAVED VENUES (♡) — user_id for members, device_token for guests
CREATE TABLE saved_venues (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NULL,
  device_token VARCHAR(64) NULL,
  venue_id     INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_user_venue (user_id, venue_id),
  UNIQUE KEY uq_saved_device_venue (device_token, venue_id),
  KEY idx_saved_venue (venue_id),
  CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ${T}

-- 12. QUOTE REQUESTS — Get a Quote, Check Availability, package/service quotes; source = page it came from
CREATE TABLE quote_requests (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NULL,
  full_name      VARCHAR(150) NOT NULL,
  email          VARCHAR(190) NOT NULL,
  phone          VARCHAR(30) NULL,
  event_type_id  INT UNSIGNED NULL,
  event_date     DATE NULL,
  guest_range_id INT UNSIGNED NULL,
  city_id        INT UNSIGNED NULL,
  venue_id       INT UNSIGNED NULL,
  package_id     INT UNSIGNED NULL,
  service_id     INT UNSIGNED NULL,
  message        TEXT NULL,
  source         ENUM('quote_form','venue_page','package_page','service_page','build_page','homepage_search') NOT NULL DEFAULT 'quote_form',
  \`status\`       ENUM('new','contacted','quoted','won','lost') NOT NULL DEFAULT 'new',
  admin_notes    TEXT NULL,
  ip_address     VARCHAR(45) NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_qr_status (\`status\`, created_at),
  KEY idx_qr_email (email),
  CONSTRAINT fk_qr_user       FOREIGN KEY (user_id)        REFERENCES users (id)        ON DELETE SET NULL,
  CONSTRAINT fk_qr_event_type FOREIGN KEY (event_type_id)  REFERENCES event_types (id)  ON DELETE SET NULL,
  CONSTRAINT fk_qr_guests     FOREIGN KEY (guest_range_id) REFERENCES guest_ranges (id) ON DELETE SET NULL,
  CONSTRAINT fk_qr_city       FOREIGN KEY (city_id)        REFERENCES cities (id)       ON DELETE SET NULL,
  CONSTRAINT fk_qr_venue      FOREIGN KEY (venue_id)       REFERENCES venues (id)       ON DELETE SET NULL,
  CONSTRAINT fk_qr_package    FOREIGN KEY (package_id)     REFERENCES packages (id)     ON DELETE SET NULL,
  CONSTRAINT fk_qr_service    FOREIGN KEY (service_id)     REFERENCES services (id)     ON DELETE SET NULL
) ${T}

-- 13. EVENT BUILDS (Build Your Event) — city NULL = Any, venue NULL = To be suggested
CREATE TABLE event_builds (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED NULL,
  quote_request_id INT UNSIGNED NULL,
  event_type_id    INT UNSIGNED NULL,
  city_id          INT UNSIGNED NULL,
  event_date       DATE NULL,
  guest_range_id   INT UNSIGNED NULL,
  venue_id         INT UNSIGNED NULL,
  \`status\`         ENUM('draft','submitted','proposal_sent','confirmed','cancelled') NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eb_status (\`status\`),
  CONSTRAINT fk_eb_user   FOREIGN KEY (user_id)          REFERENCES users (id)          ON DELETE SET NULL,
  CONSTRAINT fk_eb_quote  FOREIGN KEY (quote_request_id) REFERENCES quote_requests (id) ON DELETE SET NULL,
  CONSTRAINT fk_eb_type   FOREIGN KEY (event_type_id)    REFERENCES event_types (id)    ON DELETE SET NULL,
  CONSTRAINT fk_eb_city   FOREIGN KEY (city_id)          REFERENCES cities (id)         ON DELETE SET NULL,
  CONSTRAINT fk_eb_guests FOREIGN KEY (guest_range_id)   REFERENCES guest_ranges (id)   ON DELETE SET NULL,
  CONSTRAINT fk_eb_venue  FOREIGN KEY (venue_id)         REFERENCES venues (id)         ON DELETE SET NULL
) ${T}

CREATE TABLE event_build_services (
  event_build_id INT UNSIGNED NOT NULL,
  service_id     INT UNSIGNED NOT NULL,
  PRIMARY KEY (event_build_id, service_id),
  KEY idx_ebs_service (service_id),
  CONSTRAINT fk_ebs_build   FOREIGN KEY (event_build_id) REFERENCES event_builds (id) ON DELETE CASCADE,
  CONSTRAINT fk_ebs_service FOREIGN KEY (service_id)     REFERENCES services (id)     ON DELETE CASCADE
) ${T}

-- 14. SITE SETTINGS (contacts, footer, About stats)
CREATE TABLE site_settings (
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT NULL,
  PRIMARY KEY (setting_key)
) ${T}
`)
const SETTINGS = [
  ['site_name', 'Trend Events'],
  ['tagline', 'We Create. You Celebrate.'],
  ['hero_subtitle', 'From the perfect venue to the final light.'],
  ['phone', D.CONTACT.phone],
  ['email', D.CONTACT.email],
  ['instagram', '@trendevents.uk'],
  ['instagram_url', D.CONTACT.instagram],
  ['address', D.CONTACT.address],
  ['working_hours', 'Mon–Sat, 9:00–19:00'],
  ['stats_events', '500+'],
  ['stats_partner_venues', '120+'],
  ['stats_specialists', '40+'],
  ['stats_rating', '4.9'],
  ['footer_text', 'We create. You celebrate. From the perfect venue to the final light.'],
]
insert('site_settings', ['setting_key', 'setting_value'], SETTINGS)
count('site_settings', SETTINGS.length)

sql('SET FOREIGN_KEY_CHECKS = 1;\n')

// =====================================================================
//  SELF-CHECK (the prompt's checklist)
// =====================================================================
const expect = {
  cities: 5, guest_ranges: 5, event_types: 12, event_type_features: 55, service_categories: 4, services: 22,
  service_features: 132, service_images: 88, venue_categories: 12, venues: 8, venue_category_map: 34, venue_images: 24,
  packages: 7, package_items: 30, portfolio_items: 12,
}
const report = []
for (const [t, n] of Object.entries(expect)) {
  const ok = counts[t] === n
  report.push(`${ok ? 'OK  ' : 'FAIL'}  ${t.padEnd(20)} ${String(counts[t]).padStart(3)} / ${n}`)
  if (!ok) fail(`${t} = ${counts[t]}, expected ${n}`)
}
const checks = [
  ['event types (except other) have description + image', eventRows.filter((e) => e.slug !== 'other').every((e) => e.description && e.image && e.tagline && e.features.length === 5)],
  ['names plural / form labels singular', eventRows[0].name === 'Weddings' && eventRows[0].label === 'Wedding'],
  ['every service has tagline, 2-paragraph long_description, image', serviceRows.every((s) => s.tagline && s.long.split('\n\n').length === 2 && s.image)],
  ['"Stages" (not "Staging")', serviceRows.some((s) => s.slug === 'stages' && s.name === 'Stages') && !out.join('').includes("'Staging'")],
  ['sound-and-lighting present', !!serviceId['sound-and-lighting']],
  ['10 featured services', serviceRows.filter((s) => s.featured).length === 10],
  ['all venues have description', D.VENUES.every((v) => v.description)],
  ['custom package price NULL, full event popular', packageRows.find((p) => p.slug === 'custom-package').price === null && packageRows.find((p) => p.slug === 'full-event-package').popular === 1],
  ['portfolio all with cover image', portfolioRows.every((p) => p.image)],
  ['no old "Custom stage solutions" text', !out.join('').includes('Custom stage solutions')],
]
for (const [label, ok] of checks) {
  report.push(`${ok ? 'OK  ' : 'FAIL'}  ${label}`)
  if (!ok) fail(label)
}

writeFileSync(join(root, 'database/trend_events.sql'), out.join('\n'))
console.log(report.join('\n'))
console.log('\nWrote database/trend_events.sql')
