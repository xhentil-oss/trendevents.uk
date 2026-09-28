import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Heart, MapPin, Users } from 'lucide-react'
import { img } from '../data'
import { useStore } from '../store'

export function SaveButton({ id }) {
  const { saved, toggleSaved } = useStore()
  const isSaved = saved.includes(id)
  return (
    <button
      className={`save-btn ${isSaved ? 'is-saved' : ''}`}
      aria-label={isSaved ? 'Remove from saved' : 'Save venue'}
      aria-pressed={isSaved}
      onClick={(e) => {
        e.preventDefault()
        toggleSaved(id)
      }}
    >
      <Heart size={15} strokeWidth={1.6} fill={isSaved ? 'currentColor' : 'none'} />
    </button>
  )
}

export function VenueCard({ venue }) {
  return (
    <Link to={`/venues/${venue.id}`} className="venue-card">
      <div className="venue-card__img">
        <img src={img(venue.image, 700)} alt={venue.name} loading="lazy" />
        <SaveButton id={venue.id} />
      </div>
      <div className="venue-card__body">
        <h3>{venue.name}</h3>
        <p className="meta">
          <MapPin size={13} /> {venue.location}
        </p>
        <p className="meta">
          <Users size={13} /> Up to {venue.capacity} guests
        </p>
        <p className="venue-card__price">
          From <strong>£{venue.price.toLocaleString('en-GB')}</strong>
        </p>
      </div>
    </Link>
  )
}

export function VenueCarousel({ venues, perView = 4 }) {
  const track = useRef(null)
  const scroll = (dir) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' })
  }
  return (
    <div className="carousel" style={{ '--per-view': perView }}>
      <button className="carousel__arrow carousel__arrow--prev" aria-label="Previous" onClick={() => scroll(-1)}>
        <ChevronLeft size={18} />
      </button>
      <div className="carousel__track" ref={track}>
        {venues.map((v) => (
          <VenueCard key={v.id} venue={v} />
        ))}
      </div>
      <button className="carousel__arrow carousel__arrow--next" aria-label="Next" onClick={() => scroll(1)}>
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
