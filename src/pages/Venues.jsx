import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GUEST_MIN, GUEST_OPTIONS, HERO_IMAGES, LOCATIONS, VENUES, VENUE_CATEGORIES, slug } from '../data'
import { VenueCard } from '../components/Venues'
import { CtaBanner, PageHero } from '../components/Blocks'

// Search-bar event types → the venue category they relate to
const EVENT_TO_CATEGORY = {
  Wedding: 'Wedding Venues',
  Engagement: 'Wedding Venues',
  Birthday: 'Birthday Venues',
  'Baby Shower': 'Party Venues',
  'Private Party': 'Party Venues',
  'Christmas Party': 'Party Venues',
  'Corporate Event': 'Corporate Venues',
  'Product Launch': 'Corporate Venues',
  Conference: 'Conference Venues',
}

export default function Venues() {
  const [params, setParams] = useSearchParams()
  const categorySlug = params.get('category') || ''
  const eventType = params.get('eventType') || ''
  const location = params.get('location') || ''
  const guests = params.get('guests') || ''

  const category =
    VENUE_CATEGORIES.find((c) => slug(c) === categorySlug) || EVENT_TO_CATEGORY[eventType] || ''

  const results = useMemo(
    () =>
      VENUES.filter(
        (v) =>
          (!category || v.categories.includes(category)) &&
          (!location || v.location === location) &&
          (!guests || v.capacity >= GUEST_MIN[guests]),
      ),
    [category, location, guests],
  )

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (key === 'category') next.delete('eventType')
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHero
        image={HERO_IMAGES.venues}
        eyebrow="Exclusive spaces"
        title="Find the"
        italic="Perfect Venue."
        text="From luxury halls to unique spaces — explore venues hand-picked by our team."
      />

      <section className="section section--cream">
        <div className="container">
          <div className="chips">
            <button className={`chip ${!category ? 'is-active' : ''}`} onClick={() => setParam('category', '')}>
              All Venues
            </button>
            {VENUE_CATEGORIES.map((c) => (
              <button
                key={c}
                className={`chip ${category === c ? 'is-active' : ''}`}
                onClick={() => setParam('category', slug(c))}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="filters">
            <select value={location} onChange={(e) => setParam('location', e.target.value)} aria-label="Location">
              <option value="">All locations</option>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select value={guests} onChange={(e) => setParam('guests', e.target.value)} aria-label="Guests">
              <option value="">Any size</option>
              {GUEST_OPTIONS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <span className="filters__count">
              {results.length} venue{results.length === 1 ? '' : 's'}
              {category && ` · ${category}`}
            </span>
          </div>

          {results.length ? (
            <div className="venue-grid">
              {results.map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          ) : (
            <p className="empty">No venues match these filters yet — tell us what you need and we'll find one for you.</p>
          )}
        </div>
      </section>

      <CtaBanner
        eyebrow="Can't find it?"
        title="Let Us Find Your Venue"
        text="Our venue-finding team has access to hundreds of spaces that aren't listed online."
        button="Get a Quote"
        to="/quote"
      />
    </>
  )
}
