// Admin: website content editors (venues, packages, event types, services, Our Work, settings).
// Changes are saved to the database and show on the website on the next page load.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, EyeOff, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { api, apiDelete, apiPost, uploadImage } from '../api'
import { img } from '../data'
import { useStore } from '../store'

// ---------------------------------------------------------------- section definitions

const money = (v) => (v == null || v === '' ? 'Tailored price' : `£${Number(v).toLocaleString('en-GB')}`)

export const CONTENT_SECTIONS = {
  venues: {
    label: 'Venues',
    path: 'admin/venues',
    create: true,
    remove: true,
    blank: { name: '', city_id: '', capacity: '', price_from: '', description: '', categories: [], images: [], is_active: 1 },
    title: (r) => r.name,
    subtitle: (r) => `${r.city} · up to ${r.capacity} guests · from ${money(r.price_from)}`,
    thumb: (r) => r.images?.[0],
    link: (r) => (r.slug ? `/venues/${r.slug}` : null),
    fields: (o) => [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'city_id', label: 'City', type: 'select', options: o.cities || [] },
      { key: 'capacity', label: 'Capacity (max guests)', type: 'number', half: true },
      { key: 'price_from', label: 'Price from (£)', type: 'number', half: true },
      { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
      { key: 'categories', label: 'Perfect for (filters on the Venues page)', type: 'checkboxes', options: o.categories || [] },
      { key: 'images', label: 'Photos — the first one is the main photo', type: 'gallery' },
      { key: 'is_active', label: 'Show on the website', type: 'toggle' },
    ],
  },
  packages: {
    label: 'Packages',
    path: 'admin/packages',
    create: true,
    remove: true,
    blank: { name: '', description: '', price_from: '', image: '', items: [], is_popular: 0, is_active: 1 },
    title: (r) => r.name,
    subtitle: (r) => `${money(r.price_from)}${+r.is_popular ? ' · Most popular' : ''}`,
    thumb: (r) => r.image,
    link: () => '/packages',
    fields: () => [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Short description', type: 'textarea', rows: 2 },
      { key: 'price_from', label: 'Price from (£) — leave empty for "Tailored price"', type: 'number' },
      { key: 'items', label: "What's included — one per line", type: 'lines' },
      { key: 'image', label: 'Photo', type: 'image' },
      { key: 'is_popular', label: 'Mark as "Most popular"', type: 'toggle' },
      { key: 'is_active', label: 'Show on the website', type: 'toggle' },
    ],
  },
  'event-types': {
    label: 'Event types',
    path: 'admin/event-types',
    title: (r) => r.name,
    subtitle: (r) => r.tagline,
    thumb: (r) => r.image,
    link: (r) => `/events#${r.slug}`,
    fields: () => [
      { key: 'tagline', label: 'Short text (tiles & cards)', type: 'text' },
      { key: 'description', label: 'Description (Events page)', type: 'textarea', rows: 5 },
      { key: 'min_guests', label: 'Guests from', type: 'number', half: true },
      { key: 'max_guests', label: 'Guests up to (empty = any size)', type: 'number', half: true },
      { key: 'features', label: 'What we take care of — one per line', type: 'lines' },
      { key: 'image', label: 'Photo', type: 'image' },
    ],
  },
  services: {
    label: 'Services',
    path: 'admin/services',
    title: (r) => r.name,
    subtitle: (r) => `${r.category}${+r.is_featured ? ' · on the Home page' : ''}`,
    thumb: (r) => r.image,
    link: (r) => `/services/${r.slug}`,
    fields: () => [
      { key: 'short_description', label: 'Card text', type: 'text' },
      { key: 'tagline', label: 'Page subtitle', type: 'text' },
      { key: 'long_description', label: 'About this service — leave an empty line between the two paragraphs', type: 'textarea', rows: 8 },
      { key: 'features', label: "What's included — one per line", type: 'lines' },
      { key: 'image', label: 'Card photo', type: 'image' },
      { key: 'gallery', label: 'Gallery photos — the first one is also the page header', type: 'gallery' },
    ],
  },
  portfolio: {
    label: 'Our Work',
    path: 'admin/portfolio',
    create: true,
    remove: true,
    blank: { title: '', event_type_id: '', cover_image: '', is_active: 1 },
    title: (r) => r.title,
    subtitle: (r) => r.type,
    thumb: (r) => r.cover_image,
    link: () => '/our-work',
    fields: (o) => [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'event_type_id', label: 'Event type (filter)', type: 'select', options: o.event_types || [] },
      { key: 'cover_image', label: 'Photo', type: 'image' },
      { key: 'is_active', label: 'Show on the website', type: 'toggle' },
    ],
  },
}

const SETTINGS_FIELDS = [
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'instagram_url', label: 'Instagram link', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'working_hours', label: 'Opening hours (Get a Quote page)', type: 'text' },
]

// ---------------------------------------------------------------- field widgets

function ImageField({ value, onChange }) {
  return <Gallery value={value ? [value] : []} onChange={(list) => onChange(list[list.length - 1] || '')} single />
}

function Gallery({ value = [], onChange, single = false }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const pick = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setError(null)
    const added = []
    for (const f of single ? files.slice(0, 1) : files) {
      const r = await uploadImage(f)
      if (r.ok) added.push(r.path)
      else setError(r.error)
    }
    setBusy(false)
    if (added.length) onChange(single ? added : [...value, ...added])
  }
  const move = (i, d) => {
    const list = [...value]
    ;[list[i], list[i + d]] = [list[i + d], list[i]]
    onChange(list)
  }

  return (
    <div>
      <div className="adm-gallery">
        {value.map((src, i) => (
          <div key={src + i} className="adm-gallery__item">
            <img src={img(src, 300)} alt="" />
            {!single && i === 0 && <span className="adm-gallery__main">Main</span>}
            <div className="adm-gallery__tools">
              {!single && i > 0 && (
                <button type="button" title="Move left" onClick={() => move(i, -1)}>
                  <ArrowUp size={13} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              )}
              {!single && i < value.length - 1 && (
                <button type="button" title="Move right" onClick={() => move(i, 1)}>
                  <ArrowDown size={13} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              )}
              <button type="button" title="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="adm-gallery__add" onClick={() => input.current.click()} disabled={busy}>
          <ImagePlus size={20} />
          <span>{busy ? 'Uploading…' : single && value.length ? 'Replace photo' : 'Add photo'}</span>
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple={!single} hidden onChange={pick} />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

function Field({ f, value, onChange, error }) {
  let control
  if (f.type === 'textarea') control = <textarea rows={f.rows || 4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  else if (f.type === 'lines')
    control = (
      <textarea
        rows={Math.max(4, (value || []).length + 1)}
        value={Array.isArray(value) ? value.join('\n') : value ?? ''}
        onChange={(e) => onChange(e.target.value.split('\n'))}
      />
    )
  else if (f.type === 'select')
    control = (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  else if (f.type === 'checkboxes')
    control = (
      <div className="adm-checks">
        {f.options.map((o) => {
          const on = (value || []).includes(o)
          return (
            <label key={o} className={on ? 'is-on' : ''}>
              <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== o) : [...(value || []), o])} />
              {o}
            </label>
          )
        })}
      </div>
    )
  else if (f.type === 'toggle')
    return (
      <label className="adm-toggle-field">
        <input type="checkbox" checked={Boolean(Number(value))} onChange={(e) => onChange(e.target.checked ? 1 : 0)} />
        <span>{f.label}</span>
      </label>
    )
  else if (f.type === 'image') control = <ImageField value={value} onChange={onChange} />
  else if (f.type === 'gallery') control = <Gallery value={value || []} onChange={onChange} />
  else control = <input type={f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />

  return (
    <label className={`adm-field ${f.half ? 'adm-field--half' : ''}`}>
      {f.label}
      {control}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

// ---------------------------------------------------------------- list + editor

export function ContentSection({ id }) {
  const def = CONTENT_SECTIONS[id]
  const { sessionExpired } = useStore()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // row being edited (copy), or blank for new
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notice, setNotice] = useState(null)

  const handle = useCallback(
    (r) => {
      if (r.status === 401) {
        sessionExpired()
        return false
      }
      return true
    },
    [sessionExpired],
  )

  const load = useCallback(async () => {
    const r = await api(def.path)
    if (!handle(r)) return
    if (r.ok) setData(r.data)
    else setError(r.error)
  }, [def.path, handle])

  useEffect(() => {
    setData(null)
    setEditing(null)
    load()
  }, [load])

  const open = (row) => {
    setEditing(row ? { ...row } : { ...def.blank })
    setFieldErrors({})
    setConfirmDelete(false)
    setError(null)
  }

  const save = async () => {
    setSaving(true)
    setFieldErrors({})
    const body = { ...editing }
    for (const f of def.fields(data?.options || {})) {
      if (f.type === 'lines') body[f.key] = (body[f.key] || []).map((x) => x.trim()).filter(Boolean)
    }
    const r = await apiPost(editing.id ? `${def.path}/${editing.id}` : def.path, body)
    setSaving(false)
    if (!handle(r)) return
    if (!r.ok) {
      setFieldErrors(r.fields || {})
      setError(r.error)
      return
    }
    setData(r.data)
    setEditing(null)
    setNotice('Saved — refresh the website to see the change.')
    setTimeout(() => setNotice(null), 4000)
  }

  const remove = async () => {
    setSaving(true)
    const r = await apiDelete(`${def.path}/${editing.id}`)
    setSaving(false)
    if (!handle(r)) return
    if (!r.ok) return setError(r.error)
    setEditing(null)
    setNotice('Deleted.')
    setTimeout(() => setNotice(null), 3000)
    load()
  }

  const fields = def.fields(data?.options || {})

  return (
    <>
      <div className="adm-head">
        <h2>
          {def.label} {data && <small>({data.rows.length})</small>}
        </h2>
        {def.create && (
          <button className="btn btn--gold btn--sm" onClick={() => open(null)}>
            <Plus size={14} /> Add new
          </button>
        )}
      </div>
      {notice && <p className="form-success">{notice}</p>}
      {error && !editing && <p className="form-error">{error}</p>}
      {!data && !error && <p className="adm-muted">Loading…</p>}
      {data && (
        <div className="adm-content-grid">
          {data.rows.map((r) => (
            <button key={r.id} className={`adm-content-card ${r.is_active !== undefined && !+r.is_active ? 'is-hidden' : ''}`} onClick={() => open(r)}>
              {def.thumb(r) ? <img src={img(def.thumb(r), 400)} alt="" /> : <span className="adm-content-card__noimg" />}
              <span className="adm-content-card__body">
                <strong>{def.title(r)}</strong>
                <span>{def.subtitle(r)}</span>
                {r.is_active !== undefined && !+r.is_active && (
                  <em>
                    <EyeOff size={12} /> Hidden from the website
                  </em>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className="adm-drawer-bg" onClick={() => setEditing(null)}>
          <aside className="adm-drawer adm-drawer--wide" onClick={(e) => e.stopPropagation()}>
            <button className="adm-icon-btn adm-drawer__close" onClick={() => setEditing(null)} aria-label="Close">
              <X size={18} />
            </button>
            <p className="adm-eyebrow">{editing.id ? `Edit ${def.label.toLowerCase()}` : `New — ${def.label}`}</p>
            <h2>{def.title(editing) || 'New'}</h2>
            {editing.id && def.link(editing) && (
              <a className="adm-viewlink" href={def.link(editing)} target="_blank" rel="noreferrer">
                View on the website <ExternalLink size={13} />
              </a>
            )}
            <div className="adm-form">
              {fields.map((f) => (
                <Field
                  key={f.key}
                  f={f}
                  value={editing[f.key]}
                  error={fieldErrors[f.key]}
                  onChange={(v) => setEditing((e) => ({ ...e, [f.key]: v }))}
                />
              ))}
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="adm-drawer__actions">
              <button className="btn btn--gold btn--sm" disabled={saving} onClick={save}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditing(null)}>
                Cancel
              </button>
              {def.remove && editing.id && !confirmDelete && (
                <button className="adm-danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
            {confirmDelete && (
              <div className="adm-confirm" role="alertdialog">
                <p>
                  Delete <strong>{def.title(editing)}</strong> from the website? This cannot be undone. (To keep it but hide it, untick
                  &quot;Show on the website&quot; instead.)
                </p>
                <div>
                  <button className="adm-confirm__yes" disabled={saving} onClick={remove}>
                    <Trash2 size={14} /> Yes, delete
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

export function SettingsSection() {
  const { sessionExpired } = useStore()
  const [row, setRow] = useState(null)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    api('admin/settings').then((r) => {
      if (r.status === 401) return sessionExpired()
      if (r.ok) setRow(r.data.row)
      else setError(r.error)
    })
  }, [sessionExpired])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})
    const r = await apiPost('admin/settings', row)
    setSaving(false)
    if (r.status === 401) return sessionExpired()
    if (!r.ok) {
      setError(r.error)
      setFieldErrors(r.fields || {})
      return
    }
    setRow(r.data.row)
    setNotice('Saved — refresh the website to see the change.')
    setTimeout(() => setNotice(null), 4000)
  }

  return (
    <>
      <div className="adm-head">
        <h2>Settings</h2>
      </div>
      <p className="adm-muted">Contact details shown in the footer and on the Get a Quote page.</p>
      {!row && !error && <p className="adm-muted">Loading…</p>}
      {row && (
        <form className="adm-panel adm-form adm-settings" onSubmit={save}>
          {SETTINGS_FIELDS.map((f) => (
            <Field key={f.key} f={f} value={row[f.key]} error={fieldErrors[f.key]} onChange={(v) => setRow((r) => ({ ...r, [f.key]: v }))} />
          ))}
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-success">{notice}</p>}
          <div>
            <button className="btn btn--gold btn--sm" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
