import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { EVENT_TYPES, HERO_IMAGES, img, slug } from '../data'
import Icon from './Icon'

export function Eyebrow({ children, light }) {
  return <p className={`eyebrow ${light ? 'eyebrow--light' : ''}`}>{children}</p>
}

export function CenteredHeading({ children }) {
  return (
    <div className="centered-heading">
      <span />
      <h2>{children}</h2>
      <span />
    </div>
  )
}

export function TextLink({ to, children, light }) {
  return (
    <Link to={to} className={`text-link ${light ? 'text-link--light' : ''}`}>
      {children} <ArrowRight size={14} />
    </Link>
  )
}

// Inner-page hero
export function PageHero({ image, position, eyebrow, title, italic, text, children }) {
  return (
    <section className="page-hero" style={{ backgroundImage: `url(${img(image, 2000)})`, backgroundPosition: position }}>
      <div className="container page-hero__inner">
        {eyebrow && <Eyebrow light>{eyebrow}</Eyebrow>}
        <h1 className="display">
          {title}
          {italic && (
            <>
              <br />
              <em>{italic}</em>
            </>
          )}
        </h1>
        {text && <p className="page-hero__text">{text}</p>}
        {children}
      </div>
    </section>
  )
}

// Event-type image tiles ("What are you planning?")
export function EventTiles({ limit = 7, names }) {
  const items = names ? names.map((n) => EVENT_TYPES.find((e) => e.name === n)) : EVENT_TYPES.slice(0, limit)
  return (
    <div className="event-tiles">
      {items.map((e) => (
        <Link key={e.name} to={`/events#${slug(e.name)}`} className="event-tile">
          <img src={img(e.image, 500)} alt="" loading="lazy" style={{ objectPosition: e.position }} />
          <span className="event-tile__label">
            <Icon name={e.icon} size={26} strokeWidth={1.2} />
            {e.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

export function ServiceIconStrip({ services }) {
  return (
    <div className="service-strip">
      {services.map((s) => (
        <Link key={s.name} to="/services" className="service-strip__item">
          <Icon name={s.icon} size={24} strokeWidth={1.2} />
          <span>{s.name}</span>
        </Link>
      ))}
    </div>
  )
}

export function CtaBanner({
  eyebrow = "Let's create something amazing",
  title = 'Build Your Event',
  text = "Choose your services, venue and details — we'll create a tailored proposal just for you.",
  button = 'Start Building',
  to = '/build',
}) {
  return (
    <section className="cta-banner" style={{ backgroundImage: `url(${img(HERO_IMAGES.cta, 2000)})` }}>
      <div className="container cta-banner__inner">
        <div>
          <Eyebrow light>{eyebrow}</Eyebrow>
          <h2 className="h2 light">{title}</h2>
          <p>{text}</p>
        </div>
        <Link to={to} className="btn btn--gold">
          {button} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
