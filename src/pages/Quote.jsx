import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, CircleCheck, Mail, MapPin, Phone } from 'lucide-react'
import { ALL_SERVICES, CONTACT, FEATURED_SERVICES, GUEST_OPTIONS, HERO_IMAGES, PACKAGES, SEARCH_EVENT_TYPES, VENUES, slug } from '../data'
import { useStore } from '../store'
import { apiPost } from '../api'
import { servicePath } from '../servicePages'
import { Eyebrow, PageHero } from '../components/Blocks'
import { SocialIcons } from '../components/Icon'

export default function Quote() {
  const [params] = useSearchParams()
  const { plan } = useStore()
  const request = params.get('request')
  const isConsultation = request === 'consultation'
  const venue = VENUES.find((v) => v.id === (params.get('venue') || plan.venueId))
  const pkg = PACKAGES.find((p) => slug(p.name) === params.get('package'))
  const service = [...FEATURED_SERVICES, ...ALL_SERVICES].find((s) => slug(s.name) === params.get('service'))
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
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [website, setWebsite] = useState('') // spam trap — hidden from people

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    setFieldErrors({})

    const contact = { full_name: form.name, email: form.email, phone: form.phone, website }
    const details = {
      event_type: form.eventType || undefined,
      event_date: form.date || undefined,
      guests: form.guests || undefined,
      message: isConsultation ? `Consultation request.\n\n${form.message}`.trim() : form.message,
    }

    let result
    if (params.get('from') === 'build') {
      // Build Your Event → saves the plan + chosen services and creates the quote request
      result = await apiPost('build', {
        ...contact,
        ...details,
        city: plan.location || undefined,
        venue: plan.venueId || undefined,
        // menu names like "DJ" or "Staging" → the slug of their service page (dj-and-entertainment, stages)
        services: plan.services.map((name) => servicePath(name).split('/').pop()),
      })
    } else if (request === 'availability' && venue) {
      result = await apiPost('availability', { ...contact, ...details, venue: venue.id })
    } else {
      result = await apiPost('quote', {
        ...contact,
        ...details,
        venue: venue?.id,
        package: pkg ? slug(pkg.name) : undefined,
        service: params.get('service') || undefined,
      })
    }

    setSending(false)
    if (!result.ok) {
      setError(result.error)
      setFieldErrors(result.fields)
      return
    }
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
              {(venue || pkg || service || plan.services.length > 0) && (
                <div className="quote__context">
                  {venue && <p><strong>Venue:</strong> {venue.name}, {venue.location}</p>}
                  {pkg && <p><strong>Package:</strong> {pkg.name}</p>}
                  {service && <p><strong>Service:</strong> {service.name}</p>}
                  {plan.services.length > 0 && <p><strong>Services:</strong> {plan.services.join(', ')}</p>}
                </div>
              )}
              <div className="form-grid">
                <label>
                  Full name *
                  <input required value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!fieldErrors.full_name} />
                  {fieldErrors.full_name && <span className="field-error">{fieldErrors.full_name}</span>}
                </label>
                <label>
                  Email *
                  <input required type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!fieldErrors.email} />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </label>
                <label>
                  Phone
                  <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" aria-invalid={!!fieldErrors.phone} />
                  {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
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
                  <input
                    type="date"
                    value={form.date}
                    onChange={set('date')}
                    min={new Date().toISOString().slice(0, 10)}
                    required={request === 'availability' && !!venue}
                    aria-invalid={!!fieldErrors.event_date}
                  />
                  {fieldErrors.event_date && <span className="field-error">{fieldErrors.event_date}</span>}
                </label>
                <label>
                  Guests
                  <select value={form.guests} onChange={set('guests')} required={request === 'availability' && !!venue}>
                    <option value="">Select</option>
                    {GUEST_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </label>
                <label className="span-2">
                  Tell us about your event
                  <textarea rows={5} value={form.message} onChange={set('message')} />
                </label>
                {/* Spam trap: invisible to people, bots fill it in */}
                <label className="hp" aria-hidden="true">
                  Website
                  <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="btn btn--gold" disabled={sending}>
                {sending ? 'Sending…' : isConsultation ? 'Book a Consultation' : request === 'availability' ? 'Check Availability' : 'Get a Quote'}{' '}
                {!sending && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          <aside className="quote__aside">
            <Eyebrow>Prefer to talk?</Eyebrow>
            <h3 className="h3">Book a Consultation</h3>
            <p>Meet one of our planners in person or online — free and with no obligation.</p>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}><Phone size={16} /> {CONTACT.phone}</a>
            <a href={`mailto:${CONTACT.email}`}><Mail size={16} /> {CONTACT.email}</a>
            <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer"><SocialIcons.Instagram width="16" height="16" /> @trendevents.uk</a>
            <span><MapPin size={16} /> {CONTACT.address}</span>
            <span><CalendarDays size={16} /> Mon–Sat, 9:00–19:00</span>
          </aside>
        </div>
      </section>
    </>
  )
}
