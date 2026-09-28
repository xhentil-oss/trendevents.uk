import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown, Heart, Menu, Search, User, X } from 'lucide-react'
import { EVENT_TYPES, PACKAGES, SERVICE_GROUPS, VENUE_CATEGORIES, slug } from '../data'
import { useStore } from '../store'
import Logo from './Logo'
import SearchBar from './SearchBar'

const NAV = [
  { label: 'Home', to: '/' },
  {
    label: 'Venues',
    to: '/venues',
    menu: {
      columns: [{ items: VENUE_CATEGORIES.map((c) => ({ label: c, to: `/venues?category=${slug(c)}` })) }],
      cta: { label: 'Find a Venue', to: '/venues' },
      split: 2,
    },
  },
  {
    label: 'Events',
    to: '/events',
    menu: {
      columns: [{ items: EVENT_TYPES.map((e) => ({ label: e.name, to: `/events#${slug(e.name)}` })) }],
      cta: { label: 'Plan My Event', to: '/build' },
      split: 2,
    },
  },
  {
    label: 'Services',
    to: '/services',
    menu: {
      columns: SERVICE_GROUPS.map((g) => ({
        title: g.name,
        items: g.services.map((s) => ({ label: s.name, to: `/services#${slug(g.name)}` })),
      })),
      cta: { label: 'Explore All Services', to: '/services' },
      wide: true,
    },
  },
  {
    label: 'Packages',
    to: '/packages',
    menu: {
      columns: [{ items: PACKAGES.map((p) => ({ label: p.name, to: `/packages#${slug(p.name)}` })) }],
      cta: { label: 'Get a Quote', to: '/quote' },
    },
  },
  { label: 'Our Work', to: '/our-work' },
  { label: 'About Us', to: '/about' },
]

function splitColumns(columns, n) {
  if (!n) return columns
  const items = columns[0].items
  const per = Math.ceil(items.length / n)
  return Array.from({ length: n }, (_, i) => ({ items: items.slice(i * per, (i + 1) * per) }))
}

function Dropdown({ menu }) {
  const cols = splitColumns(menu.columns, menu.split)
  return (
    <div className={`dropdown ${menu.wide ? 'dropdown--wide' : ''}`}>
      <div className="dropdown__cols">
        {cols.map((col, i) => (
          <div key={i} className="dropdown__col">
            {col.title && <p className="dropdown__title">{col.title}</p>}
            {col.items.map((it) => (
              <Link key={it.label} to={it.to} className="dropdown__link">
                {it.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Link to={menu.cta.to} className="btn btn--gold btn--sm dropdown__cta">
        {menu.cta.label} <ArrowRight size={14} />
      </Link>
    </div>
  )
}

export default function Header() {
  const { saved } = useStore()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSection, setOpenSection] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
    setOpenSection(null)
  }, [location.pathname, location.search, location.hash])

  return (
    <header className={`header ${scrolled || mobileOpen ? 'header--solid' : ''}`}>
      <div className="container header__inner">
        <Link to="/" aria-label="Trend Events home">
          <Logo />
        </Link>

        <nav className="nav" aria-label="Main">
          {NAV.map((item) => (
            <div key={item.label} className={`nav__item ${item.menu ? 'has-menu' : ''}`}>
              <NavLink to={item.to} end={item.to === '/'} className="nav__link">
                {item.label}
                {item.menu && <ChevronDown size={12} className="nav__chev" />}
              </NavLink>
              {item.menu && <Dropdown menu={item.menu} />}
            </div>
          ))}
        </nav>

        <div className="header__actions">
          <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
            {searchOpen ? <X size={18} strokeWidth={1.5} /> : <Search size={18} strokeWidth={1.5} />}
          </button>
          <Link to="/saved" className="header__action">
            <Heart size={17} strokeWidth={1.5} /> <span>Saved ({saved.length})</span>
          </Link>
          <Link to="/account" className="header__action">
            <User size={17} strokeWidth={1.5} /> <span>Account</span>
          </Link>
          <Link to="/quote" className="btn btn--gold btn--sm header__quote">
            Get a Quote
          </Link>
          <button className="icon-btn burger" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="header__search">
          <div className="container">
            <SearchBar />
          </div>
        </div>
      )}

      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Mobile">
          {NAV.map((item) => (
            <div key={item.label} className="mobile-nav__item">
              <div className="mobile-nav__row">
                <NavLink to={item.to} end={item.to === '/'} className="mobile-nav__link">
                  {item.label}
                </NavLink>
                {item.menu && (
                  <button
                    className="icon-btn"
                    aria-label={`Show ${item.label}`}
                    onClick={() => setOpenSection(openSection === item.label ? null : item.label)}
                  >
                    <ChevronDown size={18} className={openSection === item.label ? 'rot' : ''} />
                  </button>
                )}
              </div>
              {item.menu && openSection === item.label && (
                <div className="mobile-nav__sub">
                  {item.menu.columns.map((col, i) => (
                    <div key={i}>
                      {col.title && <p className="dropdown__title">{col.title}</p>}
                      {col.items.map((it) => (
                        <Link key={it.label} to={it.to}>
                          {it.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                  <Link to={item.menu.cta.to} className="btn btn--gold btn--sm">
                    {item.menu.cta.label}
                  </Link>
                </div>
              )}
            </div>
          ))}
          <div className="mobile-nav__extra">
            <Link to="/saved">
              <Heart size={16} /> Saved ({saved.length})
            </Link>
            <Link to="/account">
              <User size={16} /> Account
            </Link>
            <Link to="/quote" className="btn btn--gold">
              Get a Quote
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
