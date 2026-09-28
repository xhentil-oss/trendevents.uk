import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { GUEST_OPTIONS, HERO_IMAGES, LOCATIONS, SEARCH_EVENT_TYPES, SERVICE_GROUPS, VENUES, img } from '../data'
import { useStore } from '../store'
import Icon from '../components/Icon'
import { PageHero } from '../components/Blocks'

// "Plan My Event" on the Events page uses plural names ("Weddings"); map them to the singular list.
const normalise = (t) => {
  const singular = t && t.replace(/Parties$/, 'Party')
  return SEARCH_EVENT_TYPES.find((s) => singular && singular.startsWith(s)) || t
}

export default function Build() {
  const navigate = useNavigate()
  const { plan, updatePlan, toggleService, resetPlan } = useStore()
  const eventType = normalise(plan.eventType)
  const venue = VENUES.find((v) => v.id === plan.venueId)
  const eventOptions = SEARCH_EVENT_TYPES.includes(eventType) || !eventType ? SEARCH_EVENT_TYPES : [eventType, ...SEARCH_EVENT_TYPES]

  return (
    <>
      <PageHero
        image={HERO_IMAGES.build}
        eyebrow="Let's create something amazing"
        title="Build"
        italic="Your Event."
        text="Choose your event, venue and services — we'll create a tailored proposal just for you."
      />

      <section className="section section--cream">
        <div className="container build">
          <div className="build__steps">
            <div className="card build__step">
              <h2 className="h3"><span className="step__num">01</span> Your event</h2>
              <div className="form-grid">
                <label>
                  Event type
                  <select value={eventType} onChange={(e) => updatePlan({ eventType: e.target.value })}>
                    <option value="">Select</option>
                    {eventOptions.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Location
                  <select value={plan.location} onChange={(e) => updatePlan({ location: e.target.value })}>
                    <option value="">Any</option>
                    {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </label>
                <label>
                  Date
                  <input type="date" value={plan.date} onChange={(e) => updatePlan({ date: e.target.value })} />
                </label>
                <label>
                  Guests
                  <select value={plan.guests} onChange={(e) => updatePlan({ guests: e.target.value })}>
                    <option value="">Select</option>
                    {GUEST_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="card build__step">
              <h2 className="h3"><span className="step__num">02</span> Choose a venue</h2>
              <div className="venue-pick">
                {VENUES.map((v) => (
                  <button
                    key={v.id}
                    className={`venue-pick__item ${plan.venueId === v.id ? 'is-selected' : ''}`}
                    onClick={() => updatePlan({ venueId: plan.venueId === v.id ? '' : v.id })}
                  >
                    <img src={img(v.image, 300)} alt="" loading="lazy" />
                    <span>
                      <strong>{v.name}</strong>
                      {v.location} · {v.capacity} guests
                    </span>
                    {plan.venueId === v.id && <Check size={16} className="venue-pick__check" />}
                  </button>
                ))}
              </div>
              <p className="small">Not sure yet? Leave it empty and our team will suggest venues.</p>
            </div>

            <div className="card build__step">
              <h2 className="h3"><span className="step__num">03</span> Add services</h2>
              {SERVICE_GROUPS.map((g) => (
                <div key={g.name} className="build__group">
                  <p className="dropdown__title">{g.name}</p>
                  <div className="toggle-list">
                    {g.services.map((s) => {
                      const on = plan.services.includes(s.name)
                      return (
                        <button key={s.name} className={`toggle ${on ? 'is-on' : ''}`} onClick={() => toggleService(s.name)}>
                          {on ? <Check size={14} /> : <Icon name={s.icon} size={14} strokeWidth={1.5} />} {s.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="card summary">
            <h2 className="h3">Your Event</h2>
            <dl>
              <dt>Event</dt>
              <dd>{eventType || '—'}</dd>
              <dt>Location</dt>
              <dd>{plan.location || '—'}</dd>
              <dt>Date</dt>
              <dd>{plan.date || '—'}</dd>
              <dt>Guests</dt>
              <dd>{plan.guests || '—'}</dd>
              <dt>Venue</dt>
              <dd>{venue ? <Link to={`/venues/${venue.id}`}>{venue.name}</Link> : 'To be suggested'}</dd>
              <dt>Services</dt>
              <dd>{plan.services.length ? plan.services.join(', ') : '—'}</dd>
            </dl>
            <button className="btn btn--gold btn--block" onClick={() => navigate('/quote?from=build')}>
              Get a Quote <ArrowRight size={16} />
            </button>
            <button className="btn btn--ghost btn--block" onClick={resetPlan}>
              <RotateCcw size={14} /> Start over
            </button>
          </aside>
        </div>
      </section>
    </>
  )
}
