import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, CircleCheck, Mail, MapPin, Phone } from 'lucide-react'
import { CONTACT, GUEST_OPTIONS, HERO_IMAGES, PACKAGES, SEARCH_EVENT_TYPES, VENUES, slug } from '../data'
import { useStore } from '../store'
import { Eyebrow, PageHero } from '../components/Blocks'

export default function Quote() {
  const [params] = useSearchParams()
  const { plan } = useStore()
  const request = params.get('request')
  const isConsultation = request === 'consultation'
  const venue = VENUES.find((v) => v.id === (params.get('venue') || plan.venueId))
  const pkg = PACKAGES.find((p) => slug(p.name) === params.get('package'))
  const [sent, setSent] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: SEARCH_EVENT_TYPES.find((t) => plan.eventType && plan.eventType.replace(/Parties$/, 'Party').startsWith(t)) || '',
    date: params.get('date') || plan.date || '',
    guests: params.get('guests') || plan.guests || '',
    message: '',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    // TODO: connect to a backend or form service (e.g. email / CRM) to actually deliver the request.
    setSent(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const title = isConsultation ? 'Book a' : request === 'availability' ? 'Check' : 'Get a'
  const italic = isConsultation ? 'Consultation.' : request === 'availability' ? 'Availability.' : 'Quote.'

  return (
    <>
      <PageHero
        image={HERO_IMAGES.quote}
        eyebrow="Let's talk"
        title={title}
        italic={italic}
        text="Tell us about your event and one of our planners will get back to you within 24 hours."
      />

      <section className="section section--cream">
        <div className="container quote">
          {sent ? (
            <div className="card thanks">
              <CircleCheck size={48} strokeWidth={1.2} className="gold" />
              <h2 className="h2">Thank You, {form.name.split(' ')[0] || 'friend'}!</h2>
              <p className="lead">We've received your request and will be in touch at {form.email} within 24 hours.</p>
            </div>
          ) : (
            <form className="card quote__form" onSubmit={submit}>
              {(venue || pkg || plan.services.length > 0) && (
                <div className="quote__context">
                  {venue && <p><strong>Venue:</strong> {venue.name}, {venue.location}</p>}
                  {pkg && <p><strong>Package:</strong> {pkg.name}</p>}
                  {plan.services.length > 0 && <p><strong>Services:</strong> {plan.services.join(', ')}</p>}
                </div>
              )}
              <div className="form-grid">
                <label>
                  Full name *
                  <input required value={form.name} onChange={set('name')} autoComplete="name" />
                </label>
                <label>
                  Email *
                  <input required type="email" value={form.email} onChange={set('email')} autoComplete="email" />
                </label>
                <label>
                  Phone
                  <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                </label>
                <label>
                  Event type
                  <select value={form.eventType} onChange={set('eventType')}>
                    <option value="">Select</option>
                    {SEARCH_EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  {isConsultation ? 'Preferred consultation date' : 'Event date'}
                  <input type="date" value={form.date} onChange={set('date')} />
                </label>
                <label>
                  Guests
                  <select value={form.guests} onChange={set('guests')}>
                    <option value="">Select</option>
                    {GUEST_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </label>
                <label className="span-2">
                  Tell us about your event
                  <textarea rows={5} value={form.message} onChange={set('message')} />
                </label>
              </div>
              <button type="submit" className="btn btn--gold">
                {isConsultation ? 'Book a Consultation' : request === 'availability' ? 'Check Availability' : 'Get a Quote'}{' '}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <aside className="quote__aside">
            <Eyebrow>Prefer to talk?</Eyebrow>
            <h3 className="h3">Book a Consultation</h3>
            <p>Meet one of our planners in person or online — free and with no obligation.</p>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}><Phone size={16} /> {CONTACT.phone}</a>
            <a href={`mailto:${CONTACT.email}`}><Mail size={16} /> {CONTACT.email}</a>
            <span><MapPin size={16} /> {CONTACT.address}</span>
            <span><CalendarDays size={16} /> Mon–Sat, 9:00–19:00</span>
          </aside>
        </div>
      </section>
    </>
  )
}
