const BASE = '/api/auth'

function authHeaders(token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchAuthMembers() {
  const res = await fetch(`${BASE}/members`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not load members.')
  return data.members
}

/**
 * @param {string | null} token
 */
export async function fetchAuthMe(token) {
  if (!token) return null
  const res = await fetch(`${BASE}/me`, { headers: authHeaders(token) })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) return null
  if (!res.ok) throw new Error(data.error || 'Session check failed.')
  return data.user
}

export async function authLogin(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: authHeaders(null),
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Sign in failed.')
  return data
}

export async function authRegister(body) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: authHeaders(null),
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not create account.')
  return data
}

export async function authLogout(token) {
  if (!token) return
  await fetch(`${BASE}/logout`, {
    method: 'POST',
    headers: authHeaders(token),
  }).catch(() => {})
}
