import { createContext, useContext, useEffect, useState } from 'react'

// Saved venues and the "Build Your Event" plan, remembered in the browser.
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

  const toggleSaved = (id) =>
    setSaved((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  const updatePlan = (patch) => setPlan((p) => ({ ...p, ...patch }))

  const toggleService = (name) =>
    setPlan((p) => ({
      ...p,
      services: p.services.includes(name) ? p.services.filter((s) => s !== name) : [...p.services, name],
    }))

  const resetPlan = () => setPlan(EMPTY_PLAN)

  return (
    <StoreContext.Provider value={{ saved, toggleSaved, plan, updatePlan, toggleService, resetPlan }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
