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

// Shrinks big photos in the browser (max 2000px, JPEG) so they stay under the server's upload limit
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.86))
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}

// Admin photo upload → { ok, path } or { ok: false, error }
export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', await shrink(file))
  try {
    const res = await fetch(`${BASE}/admin/upload`, { method: 'POST', credentials: 'include', body: form })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.path) return { ok: true, path: data.path }
    return { ok: false, error: data?.error || `Upload failed (${res.status})`, status: res.status }
  } catch {
    return { ok: false, error: 'Upload failed — check your connection' }
  }
}
