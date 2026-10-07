import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronDown, MapPin, PartyPopper, Users } from 'lucide-react'
import { GUEST_OPTIONS, LOCATIONS, SEARCH_EVENT_TYPES } from '../data'
import { useStore } from '../store'
import { apiPost } from '../api'

function Field({ icon: IconCmp, label, children }) {
  return (
    <label className="search__field">
      <IconCmp size={20} strokeWidth={1.4} className="search__icon" />
      <span className="search__body">
        <span className="search__label">{label}</span>
        {children}
      </span>
    </label>
  )
}

function Select({ value, onChange, placeholder, options }) {
  return (
    <span className="search__select">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} />
    </span>
  )
}

export default function SearchBar({ buttonLabel = 'Search Events' }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { updatePlan } = useStore()
  const [form, setForm] = useState({ eventType: '', location: '', date: '', guests: '' })
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    updatePlan(form)
    // search statistics for the admin panel — fire and forget, never delays the visitor
    apiPost('search-log', { event_type: form.eventType, city: form.location, date: form.date, guests: form.guests, page: pathname })
    const params = new URLSearchParams()
    Object.entries(form).forEach(([k, v]) => v && params.set(k, v))
    navigate(`/venues?${params}`)
  }

  return (
    <form className="search" onSubmit={submit}>
      <Field icon={PartyPopper} label="What are you planning?">
        <Select value={form.eventType} onChange={set('eventType')} placeholder="Select event type" options={SEARCH_EVENT_TYPES} />
      </Field>
      <Field icon={MapPin} label="Location">
        <Select value={form.location} onChange={set('location')} placeholder="Any location" options={LOCATIONS} />
      </Field>
      <Field icon={CalendarDays} label="Date">
        <input type="date" value={form.date} onChange={(e) => set('date')(e.target.value)} className="search__date" />
      </Field>
      <Field icon={Users} label="Guests">
        <Select value={form.guests} onChange={set('guests')} placeholder="Number of guests" options={GUEST_OPTIONS} />
      </Field>
      <button type="submit" className="btn btn--gold search__btn">
        {buttonLabel} <ArrowRight size={16} />
      </button>
    </form>
  )
}
