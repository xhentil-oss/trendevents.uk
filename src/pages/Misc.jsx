import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HERO_IMAGES, VENUES } from '../data'
import { useStore } from '../store'
import { VenueCard } from '../components/Venues'
import { PageHero } from '../components/Blocks'

export function Saved() {
  const { saved } = useStore()
  const venues = VENUES.filter((v) => saved.includes(v.id))
  return (
    <>
      <PageHero image={HERO_IMAGES.venues} eyebrow="Your shortlist" title="Saved" italic="Venues." />
      <section className="section section--cream">
        <div className="container">
          {venues.length ? (
            <div className="venue-grid">
              {venues.map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>You haven't saved any venues yet. Tap the ♡ on a venue to add it here.</p>
              <Link to="/venues" className="btn btn--gold">
                Find a Venue <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export function Account() {
  const [mode, setMode] = useState('signin')
  return (
    <>
      <PageHero image={HERO_IMAGES.about} eyebrow="Account" title="Welcome" italic="Back." />
      <section className="section section--cream">
        <div className="container narrow">
          <form className="card auth" onSubmit={(e) => e.preventDefault()}>
            <div className="tabs">
              <button type="button" className={`tab ${mode === 'signin' ? 'is-active' : ''}`} onClick={() => setMode('signin')}>
                Sign in
              </button>
              <button type="button" className={`tab ${mode === 'signup' ? 'is-active' : ''}`} onClick={() => setMode('signup')}>
                Create account
              </button>
            </div>
            {mode === 'signup' && (
              <label>
                Full name
                <input autoComplete="name" />
              </label>
            )}
            <label>
              Email
              <input type="email" autoComplete="email" />
            </label>
            <label>
              Password
              <input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </label>
            <button className="btn btn--gold btn--block">{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
            <p className="small">Accounts are coming soon — your saved venues and event plan are kept on this device for now.</p>
          </form>
        </div>
      </section>
    </>
  )
}
