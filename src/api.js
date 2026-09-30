// Client for the PHP API in /api (see api/README.md).
// Live site: same domain, so "/api" just works. Local dev: see vite.config.js (API_PROXY).
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

// Returns { ok, data } on success or { ok: false, error, fields } — never throws
export async function api(path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(`${BASE}/${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data }
    return {
      ok: false,
      error: data?.error || `Something went wrong (${res.status}). Please try again.`,
      fields: data?.fields || {},
    }
  } catch {
    return {
      ok: false,
      error: 'We could not reach the server. Please check your connection, or contact us by phone or email.',
      fields: {},
    }
  }
}

export const apiPost = (path, body) => api(path, { method: 'POST', body })
