import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { CONTACT, EVENT_TYPES, SERVICE_GROUPS, slug } from '../data'
import { SocialIcons } from './Icon'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo />
          <p className="footer__tag">We create. You celebrate. From the perfect venue to the final light.</p>
          <div className="footer__social">
            <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" aria-label="Trend Events on Instagram">
              <SocialIcons.Instagram />
            </a>
          </div>
        </div>
        <div>
          <h4>Events</h4>
          {EVENT_TYPES.slice(0, 6).map((e) => (
            <Link key={e.name} to={`/events#${slug(e.name)}`}>{e.name}</Link>
          ))}
        </div>
        <div>
          <h4>Services</h4>
          {SERVICE_GROUPS.map((g) => (
            <Link key={g.name} to={`/services#${slug(g.name)}`}>{g.name}</Link>
          ))}
          <Link to="/packages">Packages</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/our-work">Our Work</Link>
          <Link to="/venues">Venues</Link>
          <Link to="/quote">Get a Quote</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}><Phone size={14} /> {CONTACT.phone}</a>
          <a href={`mailto:${CONTACT.email}`}><Mail size={14} /> {CONTACT.email}</a>
          <span><MapPin size={14} /> {CONTACT.address}</span>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} Trend Events. All rights reserved.</span>
        <span>
          Copyright by{' '}
          <a href="https://bos.al/" target="_blank" rel="noopener noreferrer" className="footer__credit">
            bos.al
          </a>
        </span>
      </div>
    </footer>
  )
}
