// Client for the PHP API in /api (see api/README.md).
// Live site: same domain, so "/api" just works. Local dev: see vite.config.js (API_PROXY).
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

// Random id for this browser, so guests' saved venues are kept on the server too
// (and move to their account when they sign in). Sent as the X-Device-Token header.
function deviceToken() {
  try {
    let t = localStorage.getItem('trend:device')
    if (!t) {
      t = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '')
      localStorage.setItem('trend:device', t)
    }
    return t
  } catch {
    return null
  }
}

// Returns { ok, data } on success or { ok: false, error, fields } — never throws
export async function api(path, { method = 'GET', body } = {}) {
  try {
    const headers = {}
    if (body) headers['Content-Type'] = 'application/json'
    const token = deviceToken()
    if (token) headers['X-Device-Token'] = token
    const res = await fetch(`${BASE}/${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    // Without the PHP API (e.g. plain `npm run dev`) the server answers with the site's HTML,
    // so anything that isn't JSON counts as "server not reachable"
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await res.json().catch(() => null) : null
    if (!isJson) throw new Error('No API')
    if (res.ok) return { ok: true, data }
    return {
      ok: false,
      error: data?.error || `Something went wrong (${res.status}). Please try again.`,
      fields: data?.fields || {},
      status: res.status,
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
export const apiDelete = (path) => api(path, { method: 'DELETE' })
