// Text search across the whole site (header search icon and /search page)
import { ALL_SERVICES, EVENT_DETAILS, EVENT_TYPES, FEATURED_SERVICES, PACKAGES, VENUES, img, slug } from './data'
import { SERVICE_PAGES, servicePath } from './servicePages'

const PAGES = [
  { title: 'Home', to: '/', text: 'We create. You celebrate. Luxury event planning.' },
  { title: 'Venues', to: '/venues', text: 'Find the perfect venue — halls, hotels, rooftops, gardens.' },
  { title: 'Events', to: '/events', text: 'Weddings, birthdays, corporate events, conferences and more.' },
  { title: 'Services', to: '/services', text: 'Planning, décor, catering, entertainment and production.' },
  { title: 'Packages', to: '/packages', text: 'Curated event packages for every budget.' },
  { title: 'Our Work', to: '/our-work', text: 'Gallery of events we have created.' },
  { title: 'About Us', to: '/about', text: 'One team. Every detail.' },
  { title: 'Build Your Event', to: '/build', text: 'Choose your event, venue and services for a tailored proposal.' },
  { title: 'Get a Quote', to: '/quote', text: 'Contact us, request a quote or book a consultation.' },
]

function buildIndex() {
  const items = []
  const seen = new Set()
  const add = (item) => {
    if (seen.has(item.to)) return
    seen.add(item.to)
    items.push({ ...item, haystack: [item.title, item.text, ...(item.extra || [])].join(' ').toLowerCase() })
  }

  ;[...FEATURED_SERVICES, ...ALL_SERVICES].forEach((s) => {
    const to = servicePath(s.name)
    const page = SERVICE_PAGES[to.split('/').pop()]
    if (!page) return
    add({ type: 'Service', title: s.name, to, text: page.tagline, image: page.gallery[0], extra: [s.text, s.group || '', ...page.intro, ...page.includes] })
  })
  EVENT_TYPES.forEach((e) => {
    const d = EVENT_DETAILS[e.name]
    add({ type: 'Event', title: e.name, to: `/events#${slug(e.name)}`, text: e.text, image: e.image, extra: d ? [d.intro, ...d.includes] : [] })
  })
  VENUES.forEach((v) =>
    add({ type: 'Venue', title: v.name, to: `/venues/${v.id}`, text: `${v.location} · up to ${v.capacity} guests`, image: v.image, extra: [v.description, ...v.categories] }),
  )
  PACKAGES.forEach((p) =>
    add({ type: 'Package', title: p.name, to: `/packages#${slug(p.name)}`, text: p.text, image: p.image, extra: p.includes }),
  )
  PAGES.forEach((p) => add({ type: 'Page', ...p }))
  return items
}

let INDEX

// Every word must appear; title matches rank first
export function searchSite(query, limit = 50) {
  // Drop a plural "s" so "flowers" also finds "flower", "weddings" finds "wedding"
  const words = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
  if (!words.length) return []
  INDEX ??= buildIndex()
  return INDEX.filter((it) => words.every((w) => it.haystack.includes(w)))
    .map((it) => {
      const t = it.title.toLowerCase()
      const score = words.reduce((n, w) => n + (t.startsWith(w) ? 3 : t.includes(w) ? 2 : 0), 0)
      return { ...it, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((it) => ({ ...it, thumb: it.image ? img(it.image, 160) : null }))
}
