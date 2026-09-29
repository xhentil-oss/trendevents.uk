// Page sections shared by Home and Services, laid out as in the client design:
// Our Services → Explore Venues → Event Types
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { FEATURED_SERVICES, HERO_IMAGES, SERVICE_GROUPS, VENUES, img, slug } from '../data'
import { SERVICE_PAGES, servicePath } from '../servicePages'
import Icon from './Icon'
import { VenueCarousel } from './Venues'
import { EventTiles, Eyebrow, TextLink } from './Blocks'

// Order of the service cards, as in the design (two rows of five)
const CARD_ORDER = [
  'Event Planning', 'Decoration', 'Catering', 'Photography', 'Videography',
  'DJ & Entertainment', 'Sound & Lighting', 'LED Screens', 'Stages', 'Special Effects',
]
const CARDS = CARD_ORDER.map((name) => FEATURED_SERVICES.find((s) => s.name === name))

const CELEBRATE = ['Weddings', 'Birthdays', 'Engagements', 'Corporate Events', 'Private Parties', 'Conferences']

// allLink: where "Explore All Services" goes (Home → the Services page, Services → its full list)
export function OurServicesSection({ allLink = '/services#all-services' }) {
  return (
    <section className="section section--cream" id="our-services">
      <div className="container">
        <div className="row-between row-between--top">
          <div>
            <Eyebrow>Our services</Eyebrow>
            <h2 className="h2">
              Everything
              <br />
              Your Event Needs
            </h2>
          </div>
          <div className="row-between__aside">
            <p>From creative planning to production, we provide full-service event solutions tailored to your style, budget and vision.</p>
            <TextLink to={allLink}>Explore All Services</TextLink>
          </div>
        </div>
        <div className="service-cards">
          {CARDS.map((s) => (
            <Link key={s.name} to={`/services/${slug(s.name)}`} className="service-card">
              <img src={img(s.image, 500)} alt="" loading="lazy" />
              <div className="service-card__body">
                <Icon name={s.icon} size={18} strokeWidth={1.4} />
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                </div>
                <ChevronRight size={16} className="service-card__chev" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Every service from the SERVICES menu, grouped — target of "Explore All Services"
export function AllServicesSection() {
  return (
    <section className="section section--light" id="all-services">
      <div className="container">
        <Eyebrow>Full list</Eyebrow>
        <h2 className="h2">All Services</h2>
        {SERVICE_GROUPS.map((g) => (
          <div key={g.name} className="all-services__group" id={slug(g.name)}>
            <h3 className="all-services__title">{g.name}</h3>
            <div className="all-services__grid">
              {g.services.map((s) => {
                const to = servicePath(s.name)
                const page = SERVICE_PAGES[to.split('/').pop()]
                return (
                  <Link key={s.name} to={to} className="all-services__item">
                    <img src={img(page ? page.gallery[0] : s.image, 400)} alt="" loading="lazy" />
                    <span>
                      <strong>
                        <Icon name={s.icon} size={15} strokeWidth={1.5} /> {s.name}
                      </strong>
                      {s.text}
                    </span>
                    <ChevronRight size={16} className="all-services__chev" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function VenuesSection() {
  return (
    <section className="section section--light">
      <div className="container split">
        <div className="split__intro">
          <Eyebrow>Explore venues</Eyebrow>
          <h2 className="h2">The Perfect Venue for Your Event</h2>
          <p>Discover our exclusive collection of venues — from luxury halls to unique spaces. We'll find the perfect match for your vision.</p>
          <Link to="/venues" className="btn btn--gold">
            Find a Venue <ArrowRight size={16} />
          </Link>
        </div>
        <VenueCarousel venues={VENUES} perView={3} />
      </div>
    </section>
  )
}

export function EventTypesSection() {
  return (
    <section
      className="section section--dark"
      style={{ backgroundImage: `linear-gradient(rgba(12,9,6,.86), rgba(12,9,6,.9)), url(${img(HERO_IMAGES.celebrate, 2000)})` }}
    >
      <div className="container">
        <Eyebrow light>Event types</Eyebrow>
        <h2 className="h2 light">What Are You Celebrating?</h2>
        <EventTiles names={CELEBRATE} />
      </div>
    </section>
  )
}
