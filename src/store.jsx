import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, apiDelete, apiPost } from './api'

// Signed-in user, saved venues and the "Build Your Event" plan.
// Saved venues live on the server (per account, or per device for guests);
// the copy in localStorage is only a fallback when the API can't be reached.
const StoreContext = createContext(null)

const EMPTY_PLAN = { eventType: '', venueId: '', services: [], date: '', guests: '', location: '' }

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function usePersisted(key, fallback) {
  const [value, setValue] = useState(() => load(key, fallback))
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable — keep in memory only
    }
  }, [key, value])
  return [value, setValue]
}

export function StoreProvider({ children }) {
  const [saved, setSaved] = usePersisted('trend:saved', [])
  const [plan, setPlan] = usePersisted('trend:plan', EMPTY_PLAN)
  const [user, setUser] = useState(undefined) // undefined = not checked yet, null = guest
  const [online, setOnline] = useState(false) // API reachable → saves go to the server

  // Load the saved list from the server (account or this device). Venues saved
  // while the API was unreachable are uploaded first so nothing is lost.
  const syncSaved = useCallback(async () => {
    const r = await api('saved')
    if (!r.ok) return false
    const server = r.data.map((v) => v.slug)
    const pending = load('trend:saved', []).filter((id) => !server.includes(id))
    if (pending.length && !load('trend:synced', false)) {
      await Promise.all(pending.map((id) => apiPost('saved', { venue: id })))
      server.push(...pending)
    }
    try {
      localStorage.setItem('trend:synced', 'true')
    } catch {
      // ignore
    }
    setSaved(server)
    return true
  }, [setSaved])

  useEffect(() => {
    api('me').then(async (r) => {
      setUser(r.ok ? (r.data?.user ?? null) : null)
      if (r.ok) setOnline(await syncSaved())
    })
  }, [syncSaved])

  const toggleSaved = async (id) => {
    const isSaved = saved.includes(id)
    setSaved((list) => (isSaved ? list.filter((x) => x !== id) : [...list, id])) // instant feedback
    if (!online) return
    const r = isSaved ? await apiDelete(`saved/${encodeURIComponent(id)}`) : await apiPost('saved', { venue: id })
    if (!r.ok) setSaved((list) => (isSaved ? [...list, id] : list.filter((x) => x !== id))) // undo on failure
  }

  // After sign in / sign up the server moves this device's saves into the account
  const signedIn = async (u) => {
    setUser(u)
    setOnline(await syncSaved())
  }

  // The server says the login is gone (e.g. expired) — show the signed-out state
  const sessionExpired = useCallback(() => setUser(null), [])

  const signOut = async () => {
    await apiPost('logout', {})
    setUser(null)
    setSaved([])
    await syncSaved() // back to this device's (guest) list
  }

  const updatePlan = (patch) => setPlan((p) => ({ ...p, ...patch }))

  const toggleService = (name) =>
    setPlan((p) => ({
      ...p,
      services: p.services.includes(name) ? p.services.filter((s) => s !== name) : [...p.services, name],
    }))

  const resetPlan = () => setPlan(EMPTY_PLAN)

  return (
    <StoreContext.Provider
      value={{ user, signedIn, signOut, sessionExpired, saved, toggleSaved, plan, updatePlan, toggleService, resetPlan }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
