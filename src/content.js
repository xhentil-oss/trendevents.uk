// Loads the website content from the database (GET /api/content) before the app starts and
// writes it into the content objects of data.js / servicePages.js, so every page shows what
// was edited in /admin. If the API can't be reached, the built-in content stays as it is.
import * as D from './data'
import { SERVICE_PAGES } from './servicePages'

const replace = (list, items) => list.splice(0, list.length, ...items)

const guestsLabel = (min, max) => {
  const n = (x) => Number(x).toLocaleString('en-GB')
  if (min != null && max != null) return `${n(min)} – ${n(max)} guests`
  if (min != null) return `${n(min)}+ guests`
  if (max != null) return `Up to ${n(max)} guests`
  return 'Any size'
}

function apply(c) {
  if (c.venues?.length) {
    replace(
      D.VENUES,
      c.venues.map((v) => ({
        id: v.slug,
        name: v.name,
        location: v.city,
        capacity: Number(v.capacity),
        price: Number(v.price_from),
        image: v.images[0] || '',
        gallery: v.images,
        categories: v.categories,
        description: v.description || '',
      })),
    )
  }

  if (c.packages?.length) {
    // crop positions are a design detail kept in code
    const position = Object.fromEntries(D.PACKAGES.map((p) => [D.slug(p.name), p.position]))
    replace(
      D.PACKAGES,
      c.packages.map((p) => ({
        name: p.name,
        image: p.image,
        from: p.price_from == null ? null : Number(p.price_from),
        text: p.description || '',
        includes: p.items,
        featured: Boolean(Number(p.is_popular)),
        position: position[p.slug],
      })),
    )
  }

  for (const e of c.event_types || []) {
    const t = D.EVENT_TYPES.find((x) => D.slug(x.name) === e.slug)
    if (!t) continue
    if (e.tagline) t.text = e.tagline
    if (e.image) t.image = e.image
    D.EVENT_DETAILS[t.name] = {
      intro: e.description || '',
      includes: e.features,
      guests: guestsLabel(e.min_guests, e.max_guests),
    }
  }

  const serviceLists = [D.FEATURED_SERVICES, D.ALL_SERVICES, ...D.SERVICE_GROUPS.map((g) => g.services)]
  for (const s of c.services || []) {
    const page = SERVICE_PAGES[s.slug]
    if (page) {
      if (s.tagline) page.tagline = s.tagline
      const paragraphs = (s.long_description || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)
      if (paragraphs.length) page.intro = paragraphs
      if (s.features.length) page.includes = s.features
      if (s.gallery.length) page.gallery = s.gallery
    }
    for (const list of serviceLists) {
      for (const item of list) {
        if (D.slug(item.name) !== s.slug) continue
        if (s.image) item.image = s.image
        if (s.short_description) item.text = s.short_description
      }
    }
  }

  if (c.portfolio?.length) {
    replace(D.PORTFOLIO, c.portfolio.map((p) => ({ title: p.title, type: p.type, image: p.cover_image })))
  }

  const st = c.settings || {}
  if (st.phone) D.CONTACT.phone = st.phone
  if (st.email) D.CONTACT.email = st.email
  if (st.address) D.CONTACT.address = st.address
  if (st.instagram_url) D.CONTACT.instagram = st.instagram_url
  if (st.working_hours) D.CONTACT.hours = st.working_hours
}

export async function loadContent() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(`${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/content`, { signal: controller.signal })
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) return
    apply(await res.json())
  } catch {
    // offline / no API (e.g. `npm run dev`) — keep the built-in content
  } finally {
    clearTimeout(timer)
  }
}
