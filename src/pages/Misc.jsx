import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HERO_IMAGES, VENUES } from '../data'
import { useStore } from '../store'
import { api, apiPost } from '../api'
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
  const [user, setUser] = useState(undefined) // undefined = still checking
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api('me').then((r) => setUser(r.ok ? r.data.user : null))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})
    const body = mode === 'signin' ? { email: form.email, password: form.password } : form
    const r = await apiPost(mode === 'signin' ? 'login' : 'register', body)
    setBusy(false)
    if (!r.ok) {
      setError(r.error)
      setFieldErrors(r.fields)
      return
    }
    setUser(r.data.user)
    setForm({ full_name: '', email: '', password: '' })
  }

  const logout = async () => {
    await apiPost('logout', {})
    setUser(null)
  }

  return (
    <>
      <PageHero image={HERO_IMAGES.about} eyebrow="Account" title={user ? 'Hello,' : 'Welcome'} italic={user ? `${user.full_name.split(' ')[0]}.` : 'Back.'} />
      <section className="section section--cream">
        <div className="container narrow">
          {user ? (
            <div className="card auth">
              <h2 className="h3">Your account</h2>
              <p>
                <strong>{user.full_name}</strong>
                <br />
                {user.email}
              </p>
              <Link to="/saved" className="btn btn--gold btn--block">
                Saved Venues <ArrowRight size={16} />
              </Link>
              <Link to="/build" className="btn btn--outline btn--block">
                Build Your Event
              </Link>
              <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
                Sign out
              </button>
            </div>
          ) : (
            <form className="card auth" onSubmit={submit}>
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
                  <input required autoComplete="name" value={form.full_name} onChange={set('full_name')} aria-invalid={!!fieldErrors.full_name} />
                  {fieldErrors.full_name && <span className="field-error">{fieldErrors.full_name}</span>}
                </label>
              )}
              <label>
                Email
                <input required type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!fieldErrors.email} />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={set('password')}
                  aria-invalid={!!fieldErrors.password}
                />
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn btn--gold btn--block" disabled={busy || user === undefined}>
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
              {mode === 'signup' && <p className="small">At least 8 characters.</p>}
            </form>
          )}
        </div>
      </section>
    </>
  )
}
