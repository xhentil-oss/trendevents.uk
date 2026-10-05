// Admin dashboard (/admin) — requests, events, users and saved venues from the database.
// Access: users with role = 'admin' (see api/admin.php).
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, CalendarDays, Download, Heart, Inbox, LayoutDashboard, LogOut, Mail, Phone, RefreshCw, Search, Trash2, Users, X,
} from 'lucide-react'
import { api, apiDelete, apiPost } from '../api'
import { useStore } from '../store'
import Logo from '../components/Logo'
import '../admin.css'

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost']
const SOURCES = {
  quote_form: 'Get a Quote', venue_page: 'Check Availability', package_page: 'Package',
  service_page: 'Service', build_page: 'Build Your Event', homepage_search: 'Homepage search',
}
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'saved', label: 'Saved venues', icon: Heart },
]

const fmtDate = (d) => (d ? new Date(d.replace(' ', 'T')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const fmtDateTime = (d) =>
  d ? new Date(d.replace(' ', 'T')).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const daysUntil = (d) => Math.round((new Date(d) - new Date(new Date().toDateString())) / 86400000)

function StatusBadge({ status }) {
  return <span className={`adm-badge adm-badge--${status}`}>{status}</span>
}

// Loads an admin endpoint; returns [data, error, reload]
function useAdminData(path) {
  const [state, setState] = useState({ data: null, error: null })
  const load = useCallback(async () => {
    const r = await api(path)
    setState(r.ok ? { data: r.data, error: null } : { data: null, error: r.error })
  }, [path])
  useEffect(() => {
    load()
  }, [load])
  return [state.data, state.error, load]
}

// ---------------------------------------------------------------- login / access

function AdminLogin() {
  const { signedIn } = useStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const r = await apiPost('login', form)
    setBusy(false)
    if (!r.ok) return setError(r.error)
    await signedIn(r.data.user)
  }
  return (
    <div className="adm-gate">
      <form className="adm-gate__card" onSubmit={submit}>
        <Logo />
        <h1>Admin dashboard</h1>
        <label>
          Email
          <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Password
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn--gold btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="adm-gate__back">
          <ArrowLeft size={14} /> Back to the website
        </Link>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------- overview

function Overview({ openRequest, goTo }) {
  const [s, error, reload] = useAdminData('admin/stats')
  if (error) return <p className="form-error">{error}</p>
  if (!s) return <p className="adm-muted">Loading…</p>
  const cards = [
    { label: 'New requests', value: s.new, hint: 'waiting for a reply', tab: 'requests' },
    { label: 'Requests this month', value: s.this_month, hint: `${s.requests} in total`, tab: 'requests' },
    { label: 'Upcoming events', value: s.upcoming_events, hint: 'with an event date', tab: 'events' },
    { label: 'Won', value: s.won, hint: 'confirmed bookings', tab: 'requests' },
    { label: 'Accounts', value: s.users, hint: 'registered users', tab: 'users' },
    { label: 'Saved venues', value: s.saved, hint: '♡ saves', tab: 'saved' },
  ]
  const max = Math.max(1, ...s.by_source.map((x) => +x.n))
  return (
    <>
      <div className="adm-head">
        <h2>Overview</h2>
        <button className="adm-icon-btn" onClick={reload} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="adm-cards">
        {cards.map((c) => (
          <button key={c.label} className="adm-card" onClick={() => goTo(c.tab)}>
            <span>{c.label}</span>
            <strong>{c.value}</strong>
            <em>{c.hint}</em>
          </button>
        ))}
      </div>
      <div className="adm-grid2">
        <section className="adm-panel">
          <h3>Latest requests</h3>
          {s.recent.length ? (
            <ul className="adm-list">
              {s.recent.map((r) => (
                <li key={r.id} onClick={() => openRequest(r.id)}>
                  <div>
                    <strong>{r.full_name}</strong>
                    <span>{[r.event_type, r.source_label].filter(Boolean).join(' · ')}</span>
                  </div>
                  <div className="adm-list__end">
                    <StatusBadge status={r.status} />
                    <span>{fmtDateTime(r.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">No requests yet.</p>
          )}
        </section>
        <section className="adm-panel">
          <h3>Next events</h3>
          {s.next_events.length ? (
            <ul className="adm-list">
              {s.next_events.map((r) => (
                <li key={r.id} onClick={() => openRequest(r.id)}>
                  <div>
                    <strong>{fmtDate(r.event_date)}</strong>
                    <span>{[r.event_type, r.full_name, r.venue].filter(Boolean).join(' · ')}</span>
                  </div>
                  <div className="adm-list__end">
                    <StatusBadge status={r.status} />
                    <span>in {daysUntil(r.event_date)} days</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">No upcoming events.</p>
          )}
          <h3 className="adm-mt">Where requests come from</h3>
          {s.by_source.map((x) => (
            <div key={x.source} className="adm-bar">
              <span>{x.source_label}</span>
              <div>
                <i style={{ width: `${(x.n / max) * 100}%` }} />
              </div>
              <b>{x.n}</b>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- requests

function Requests({ openRequest, version }) {
  const [filters, setFilters] = useState({ status: '', source: '', q: '' })
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const params = new URLSearchParams(Object.entries({ ...filters, page }).filter(([, v]) => v))
  const [data, error, reload] = useAdminData(`admin/requests?${params}`)
  useEffect(() => {
    if (version) reload()
  }, [version, reload])
  const set = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }))
    setPage(1)
  }
  const exportParams = new URLSearchParams(Object.entries(filters).filter(([, v]) => v))

  return (
    <>
      <div className="adm-head">
        <h2>Requests {data && <small>({data.total})</small>}</h2>
        <a className="btn btn--outline btn--sm" href={`/api/admin/export?${exportParams}`}>
          <Download size={14} /> Export CSV
        </a>
      </div>
      <div className="adm-filters">
        <form
          className="adm-search"
          onSubmit={(e) => {
            e.preventDefault()
            set('q', query.trim())
          }}
        >
          <Search size={16} />
          <input placeholder="Search name, email, phone, message…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
        <select value={filters.status} onChange={(e) => set('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={filters.source} onChange={(e) => set('source', e.target.value)}>
          <option value="">All pages</option>
          {Object.entries(SOURCES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      {data && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Received</th>
                <th>Client</th>
                <th>Event</th>
                <th>Event date</th>
                <th>Guests</th>
                <th>Venue / City</th>
                <th>From</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} onClick={() => openRequest(r.id)}>
                  <td>{r.id}</td>
                  <td>{fmtDateTime(r.created_at)}</td>
                  <td>
                    <strong>{r.full_name}</strong>
                    <span>{r.email}</span>
                  </td>
                  <td>{r.event_type || '—'}</td>
                  <td>{fmtDate(r.event_date)}</td>
                  <td>{r.guests || '—'}</td>
                  <td>{r.venue || r.city || '—'}</td>
                  <td>{r.source_label}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {!data.rows.length && (
                <tr>
                  <td colSpan={9} className="adm-muted">
                    No requests match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <div className="adm-pager">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span>
            Page {data.page} of {data.pages}
          </span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  )
}

function RequestDrawer({ id, onClose, onChanged }) {
  const [r, setR] = useState(null)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    api(`admin/requests/${id}`).then((res) => {
      if (!res.ok) return setError(res.error)
      setR(res.data)
      setNotes(res.data.admin_notes || '')
    })
  }, [id])

  const update = async (patch) => {
    setSaving(true)
    const res = await apiPost(`admin/requests/${id}`, patch)
    setSaving(false)
    if (!res.ok) return setError(res.error)
    setR(res.data)
    setSavedMsg('Saved')
    setTimeout(() => setSavedMsg(''), 1500)
    onChanged()
  }

  const remove = async () => {
    if (!window.confirm(`Delete request #${id} from ${r.full_name}? This cannot be undone.`)) return
    const res = await apiDelete(`admin/requests/${id}`)
    if (!res.ok) return setError(res.error)
    onChanged()
    onClose()
  }

  const rows = r
    ? [
        ['Received', fmtDateTime(r.created_at)],
        ['From page', r.source_label],
        ['Event type', r.event_type],
        ['Event date', r.event_date && `${fmtDate(r.event_date)}${daysUntil(r.event_date) >= 0 ? ` (in ${daysUntil(r.event_date)} days)` : ''}`],
        ['Guests', r.guests],
        ['City', r.city],
        ['Venue', r.venue],
        ['Package', r.package],
        ['Service', r.service],
        ['Services chosen', r.services.join(', ')],
        ['Account', r.account ? `Registered user (${r.account.email})` : 'Guest'],
        ['Other requests', r.other_requests ? `${r.other_requests} more from this email` : null],
      ].filter(([, v]) => v)
    : []

  return (
    <div className="adm-drawer-bg" onClick={onClose}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="adm-icon-btn adm-drawer__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {error && <p className="form-error">{error}</p>}
        {!r && !error && <p className="adm-muted">Loading…</p>}
        {r && (
          <>
            <p className="adm-eyebrow">Request #{r.id}</p>
            <h2>{r.full_name}</h2>
            <div className="adm-contact">
              <a href={`mailto:${r.email}?subject=${encodeURIComponent('Your Trend Events request')}`}>
                <Mail size={14} /> {r.email}
              </a>
              {r.phone && (
                <a href={`tel:${r.phone.replace(/[^0-9+]/g, '')}`}>
                  <Phone size={14} /> {r.phone}
                </a>
              )}
            </div>

            <label className="adm-field">
              Status
              <select value={r.status} disabled={saving} onChange={(e) => update({ status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>

            <dl className="adm-dl">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            {r.message && (
              <>
                <p className="adm-eyebrow">Message</p>
                <p className="adm-message">{r.message}</p>
              </>
            )}

            <label className="adm-field">
              Internal notes (only visible here)
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Called on Monday, sending proposal Friday" />
            </label>
            <div className="adm-drawer__actions">
              <button className="btn btn--gold btn--sm" disabled={saving || notes === (r.admin_notes || '')} onClick={() => update({ admin_notes: notes })}>
                {saving ? 'Saving…' : 'Save notes'}
              </button>
              {savedMsg && <span className="adm-ok">{savedMsg} ✓</span>}
              <a className="btn btn--outline btn--sm" href={`mailto:${r.email}?subject=${encodeURIComponent('Your Trend Events request')}`}>
                <Mail size={14} /> Reply
              </a>
              <button className="adm-danger" onClick={remove}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------- events

function Events({ openRequest, version }) {
  const [past, setPast] = useState(false)
  const [rows, error, reload] = useAdminData(`admin/events${past ? '?past=1' : ''}`)
  useEffect(() => {
    if (version) reload()
  }, [version, reload])
  // group by month
  const groups = {}
  for (const r of rows || []) {
    const key = new Date(r.event_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    ;(groups[key] ||= []).push(r)
  }
  return (
    <>
      <div className="adm-head">
        <h2>{past ? 'Past events' : 'Upcoming events'}</h2>
        <div className="adm-toggle">
          <button className={!past ? 'is-on' : ''} onClick={() => setPast(false)}>
            Upcoming
          </button>
          <button className={past ? 'is-on' : ''} onClick={() => setPast(true)}>
            Past
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {rows && !rows.length && <p className="adm-muted">No {past ? 'past' : 'upcoming'} events with a date yet.</p>}
      {Object.entries(groups).map(([month, list]) => (
        <section key={month} className="adm-month">
          <h3>{month}</h3>
          {list.map((r) => {
            const d = new Date(r.event_date)
            return (
              <button key={r.id} className="adm-event" onClick={() => openRequest(r.id)}>
                <span className="adm-event__date">
                  <b>{d.getDate()}</b>
                  {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                </span>
                <span className="adm-event__body">
                  <strong>{r.event_type || 'Event'} — {r.full_name}</strong>
                  <span>{[r.guests, r.venue || r.city, r.package, r.service].filter(Boolean).join(' · ') || 'No details yet'}</span>
                </span>
                <StatusBadge status={r.status} />
              </button>
            )
          })}
        </section>
      ))}
    </>
  )
}

// ---------------------------------------------------------------- users & saved

function UsersTab({ me }) {
  const [rows, error, reload] = useAdminData('admin/users')
  const [msg, setMsg] = useState(null)
  const change = async (u, patch) => {
    const r = await apiPost(`admin/users/${u.id}`, patch)
    setMsg(r.ok ? null : r.error)
    reload()
  }
  return (
    <>
      <div className="adm-head">
        <h2>Users {rows && <small>({rows.length})</small>}</h2>
      </div>
      {(error || msg) && <p className="form-error">{error || msg}</p>}
      {rows && (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--static">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Requests</th>
                <th>Saved</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.full_name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>{fmtDate(u.created_at)}</td>
                  <td>{u.requests}</td>
                  <td>{u.saved}</td>
                  <td>
                    <select value={u.role} disabled={u.id === me.id} onChange={(e) => change(u, { role: e.target.value })}>
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <button className={`adm-pill ${+u.is_active ? '' : 'is-off'}`} disabled={u.id === me.id} onClick={() => change(u, { is_active: !+u.is_active })}>
                      {+u.is_active ? 'Active' : 'Blocked'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function SavedTab() {
  const [data, error] = useAdminData('admin/saved')
  if (error) return <p className="form-error">{error}</p>
  if (!data) return <p className="adm-muted">Loading…</p>
  const max = Math.max(1, ...data.venues.map((v) => +v.saves))
  return (
    <>
      <div className="adm-head">
        <h2>Saved venues</h2>
      </div>
      <div className="adm-grid2">
        <section className="adm-panel">
          <h3>Most saved</h3>
          {data.venues.map((v) => (
            <div key={v.slug} className="adm-bar">
              <span>
                <Link to={`/venues/${v.slug}`} target="_blank">
                  {v.name}
                </Link>{' '}
                <em>{v.city}</em>
              </span>
              <div>
                <i style={{ width: `${(v.saves / max) * 100}%` }} />
              </div>
              <b>{v.saves}</b>
            </div>
          ))}
        </section>
        <section className="adm-panel">
          <h3>Latest saves</h3>
          {data.recent.length ? (
            <ul className="adm-list adm-list--static">
              {data.recent.map((s, i) => (
                <li key={i}>
                  <div>
                    <strong>{s.venue}</strong>
                    <span>{s.full_name ? `${s.full_name} (${s.email})` : 'Guest visitor'}</span>
                  </div>
                  <div className="adm-list__end">
                    <span>{fmtDateTime(s.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">No saves yet.</p>
          )}
        </section>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- shell

export default function Admin() {
  const { user, signOut } = useStore()
  const [tab, setTab] = useState(() => (location.hash.slice(1) in { overview: 1, requests: 1, events: 1, users: 1, saved: 1 } ? location.hash.slice(1) : 'overview'))
  const [openId, setOpenId] = useState(null)
  const [version, setVersion] = useState(0) // bump to refresh lists after an edit

  useEffect(() => {
    document.title = 'Admin — Trend Events'
    return () => {
      document.title = 'Trend Events — We Create. You Celebrate.'
    }
  }, [])

  const goTo = (t) => {
    setTab(t)
    history.replaceState(null, '', `#${t}`)
  }

  if (user === undefined) return <div className="adm-gate"><p className="adm-muted">Loading…</p></div>
  if (!user) return <AdminLogin />
  if (user.role !== 'admin') {
    return (
      <div className="adm-gate">
        <div className="adm-gate__card">
          <Logo />
          <h1>No admin access</h1>
          <p className="adm-muted">You are signed in as {user.email}, which is not an admin account.</p>
          <button className="btn btn--outline btn--block" onClick={signOut}>
            Sign in with another account
          </button>
          <Link to="/" className="adm-gate__back">
            <ArrowLeft size={14} /> Back to the website
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="adm">
      <aside className="adm-side">
        <Link to="/" className="adm-side__logo">
          <Logo />
        </Link>
        <nav>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => goTo(id)}>
              <Icon size={17} /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="adm-side__foot">
          <span>{user.full_name}</span>
          <Link to="/">
            <ArrowLeft size={14} /> <span>Website</span>
          </Link>
          <button onClick={signOut}>
            <LogOut size={14} /> <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main className="adm-main">
        {tab === 'overview' && <Overview openRequest={setOpenId} goTo={goTo} key={version} />}
        {tab === 'requests' && <Requests openRequest={setOpenId} version={version} />}
        {tab === 'events' && <Events openRequest={setOpenId} version={version} />}
        {tab === 'users' && <UsersTab me={user} />}
        {tab === 'saved' && <SavedTab />}
      </main>
      {openId && <RequestDrawer id={openId} onClose={() => setOpenId(null)} onChanged={() => setVersion((v) => v + 1)} />}
    </div>
  )
}
