import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, MapPin, Plus, Users } from 'lucide-react'
import { GUEST_OPTIONS, VENUES, img } from '../data'
import { useStore } from '../store'
import { SaveButton, VenueCard } from '../components/Venues'
import { Eyebrow } from '../components/Blocks'
import NotFound from './NotFound'

export default function VenueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { plan, updatePlan } = useStore()
  const venue = VENUES.find((v) => v.id === id)
  const [date, setDate] = useState(plan.date || '')
  const [guests, setGuests] = useState(plan.guests || '')

  if (!venue) return <NotFound />

  const inPlan = plan.venueId === venue.id
  const others = VENUES.filter((v) => v.id !== venue.id).slice(0, 3)

  const checkAvailability = (e) => {
    e.preventDefault()
    updatePlan({ venueId: venue.id, date, guests })
    const q = new URLSearchParams({ venue: venue.id, date, guests, request: 'availability' })
    navigate(`/quote?${q}`)
  }

  return (
    <>
      <section className="venue-hero">
        <div className="venue-hero__gallery">
          {venue.gallery.map((g, i) => (
            <img key={g} src={img(g, i === 0 ? 1600 : 800)} alt={`${venue.name} ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="section section--cream">
        <div className="container venue-detail">
          <div>
            <Eyebrow>{venue.categories.slice(0, 2).join(' · ')}</Eyebrow>
            <div className="venue-detail__title">
              <h1 className="h2">{venue.name}</h1>
              <SaveButton id={venue.id} />
            </div>
            <p className="meta meta--lg">
              <MapPin size={16} /> {venue.location} &nbsp;·&nbsp; <Users size={16} /> Up to {venue.capacity} guests
            </p>
            <p className="lead">{venue.description}</p>
            <h3 className="h3">Perfect for</h3>
            <div className="chips chips--static">
              {venue.categories.map((c) => (
                <span key={c} className="chip">{c}</span>
              ))}
            </div>
            <button
              className={`btn ${inPlan ? 'btn--outline' : 'btn--dark'} mt`}
              onClick={() => updatePlan({ venueId: inPlan ? '' : venue.id })}
            >
              {inPlan ? <Check size={16} /> : <Plus size={16} />} {inPlan ? 'Added to Your Event' : 'Add to Event'}
            </button>
          </div>

          <form className="card availability" onSubmit={checkAvailability}>
            <p className="availability__price">
              From <strong>£{venue.price.toLocaleString('en-GB')}</strong>
            </p>
            <label>
              Event date
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              Guests
              <select required value={guests} onChange={(e) => setGuests(e.target.value)}>
                <option value="">Select</option>
                {GUEST_OPTIONS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn--gold btn--block">
              Check Availability <ArrowRight size={16} />
            </button>
            <p className="small">No payment needed. We'll confirm availability and pricing within 24 hours.</p>
          </form>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <div className="row-between">
            <h2 className="h2">You May Also Like</h2>
            <Link to="/venues" className="text-link">All Venues <ArrowRight size={14} /></Link>
          </div>
          <div className="venue-grid">
            {others.map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
