import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HERO_IMAGES, VENUES } from '../data'
import { useStore } from '../store'
import { apiPost } from '../api'
import { VenueCard } from '../components/Venues'
import { PageHero } from '../components/Blocks'

export function Saved() {
  const { saved, user } = useStore()
  const venues = VENUES.filter((v) => saved.includes(v.id))
  return (
    <>
      <PageHero image={HERO_IMAGES.venues} eyebrow="Your shortlist" title="Saved" italic="Venues." />
      <section className="section section--cream">
        <div className="container">
          {user === null && (
            <p className="form-success saved-hint">
              <Link to="/account">Sign in or create an account</Link> to keep your saved venues on every device.
            </p>
          )}
          {user && (
            <p className="saved-hint small">
              Saved to your account, {user.full_name.split(' ')[0]} — they'll be here on any device you sign in on.
            </p>
          )}
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
  const { user, signedIn, signOut, saved } = useStore()
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const switchMode = (m) => {
    setMode(m)
    setError(null)
    setNotice(null)
    setFieldErrors({})
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    setFieldErrors({})
    const r =
      mode === 'forgot'
        ? await apiPost('forgot-password', { email: form.email })
        : await apiPost(mode === 'signin' ? 'login' : 'register', mode === 'signin' ? { email: form.email, password: form.password } : form)
    setBusy(false)
    if (!r.ok) {
      setError(r.error)
      setFieldErrors(r.fields)
      return
    }
    if (mode === 'forgot') {
      setNotice(r.data.message)
      return
    }
    setForm({ full_name: '', email: '', password: '' })
    await signedIn(r.data.user)
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
                Saved Venues ({saved.length}) <ArrowRight size={16} />
              </Link>
              <Link to="/build" className="btn btn--outline btn--block">
                Build Your Event
              </Link>
              <button type="button" className="btn btn--ghost btn--block" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <form className="card auth" onSubmit={submit}>
              {mode === 'forgot' ? (
                <div>
                  <h2 className="h3">Forgot your password?</h2>
                  <p className="small auth__intro">Enter your email and we&apos;ll send you a link to choose a new one.</p>
                </div>
              ) : (
                <div className="tabs">
                  <button type="button" className={`tab ${mode === 'signin' ? 'is-active' : ''}`} onClick={() => switchMode('signin')}>
                    Sign in
                  </button>
                  <button type="button" className={`tab ${mode === 'signup' ? 'is-active' : ''}`} onClick={() => switchMode('signup')}>
                    Create account
                  </button>
                </div>
              )}
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
              {mode !== 'forgot' && (
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
              )}
              {mode === 'signin' && (
                <button type="button" className="auth__link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="form-success" role="status">
                  {notice}
                </p>
              )}
              <button className="btn btn--gold btn--block" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>
              {mode === 'signup' && <p className="small">At least 8 characters.</p>}
              {mode === 'forgot' && (
                <button type="button" className="auth__link auth__link--center" onClick={() => switchMode('signin')}>
                  ← Back to sign in
                </button>
              )}
            </form>
          )}
        </div>
      </section>
    </>
  )
}

// /reset-password?token=… — opened from the email
export function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signedIn } = useStore()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setBusy(true)
    const r = await apiPost('reset-password', { token, password })
    setBusy(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    setDone(true)
    await signedIn(r.data.user)
    setTimeout(() => navigate('/account'), 2000)
  }

  return (
    <>
      <PageHero image={HERO_IMAGES.about} eyebrow="Account" title="New" italic="Password." />
      <section className="section section--cream">
        <div className="container narrow">
          {!token ? (
            <div className="card auth">
              <p>This reset link is incomplete. Please request a new one.</p>
              <Link to="/account" className="btn btn--gold btn--block">
                Go to sign in
              </Link>
            </div>
          ) : done ? (
            <div className="card auth">
              <h2 className="h3">Password changed</h2>
              <p className="form-success">Your new password is saved and you are signed in. Taking you to your account…</p>
            </div>
          ) : (
            <form className="card auth" onSubmit={submit}>
              <h2 className="h3">Choose a new password</h2>
              <label>
                New password
                <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label>
                Repeat new password
                <input required type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error} {/expired|not valid|already used/.test(error) && <Link to="/account">Request a new link</Link>}
                </p>
              )}
              <button className="btn btn--gold btn--block" disabled={busy}>
                {busy ? 'Please wait…' : 'Save new password'}
              </button>
              <p className="small">At least 8 characters.</p>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
