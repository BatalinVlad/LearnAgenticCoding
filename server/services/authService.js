const crypto = require('crypto')
const { SEED_USERS } = require('../data/seedBoardUsers')

const REGISTER_COLOR_PALETTE = [
  '#1e8449',
  '#7d3c98',
  '#b8860b',
  '#2471a3',
  '#ca6f1e',
  '#cb4335',
  '#148f77',
  '#566573',
  '#884ea0',
  '#a04000',
  '#922b21',
  '#1f618d',
]

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (parts.length === 1) {
    return (parts[0][0] + parts[0][0]).toUpperCase()
  }
  return '??'
}

/** @param {typeof SEED_USERS[number]} member */
function toPublicUser(member) {
  return {
    id: member.id,
    username: member.username,
    name: member.name,
    initials: member.initials,
    color: member.color,
    tasks: member.tasks || [],
  }
}

function createAuthService() {
  /** @type {Map<string, number>} token -> user id */
  const sessions = new Map()
  /** In-memory sign-ups (lost on restart). Replace with MongoDB later. */
  let registeredUsers = []

  function allMembers() {
    return [...SEED_USERS, ...registeredUsers]
  }

  function nextMemberId() {
    let max = 0
    for (const m of allMembers()) max = Math.max(max, m.id)
    return max + 1
  }

  function findByUsername(username) {
    const u = username.trim().toLowerCase()
    return allMembers().find((m) => m.username.toLowerCase() === u) ?? null
  }

  function findById(id) {
    return allMembers().find((m) => m.id === id) ?? null
  }

  function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex')
    sessions.set(token, userId)
    return token
  }

  function revokeSession(token) {
    if (token) sessions.delete(token)
  }

  function getMeByToken(token) {
    if (!token) return null
    const userId = sessions.get(token)
    if (userId == null) return null
    const member = findById(userId)
    return member ? toPublicUser(member) : null
  }

  function login(username, password) {
    const u = username.trim().toLowerCase()
    const member = allMembers().find(
      (m) => m.username.toLowerCase() === u && m.password === password,
    )
    if (!member) {
      return { error: 'Invalid username or password.', status: 401 }
    }
    const token = createSession(member.id)
    return { user: toPublicUser(member), token }
  }

  function register({ name, username, password }) {
    const displayName = String(name || '').trim()
    const u = username.trim().toLowerCase()
    if (!displayName || !u || !password) {
      return { error: 'Fill in name, username, and password.', status: 400 }
    }
    if (password.length < 4) {
      return { error: 'Password must be at least 4 characters.', status: 400 }
    }
    if (!/^[a-z0-9_]{3,24}$/i.test(u)) {
      return {
        error: 'Username: 3–24 characters (letters, numbers, underscore).',
        status: 400,
      }
    }
    if (findByUsername(u)) {
      return { error: 'That username is already taken.', status: 400 }
    }
    const member = {
      id: nextMemberId(),
      username: u,
      name: displayName,
      initials: initialsFromName(displayName),
      password,
      color: REGISTER_COLOR_PALETTE[registeredUsers.length % REGISTER_COLOR_PALETTE.length],
      tasks: [],
    }
    registeredUsers = [...registeredUsers, member]
    const token = createSession(member.id)
    return { user: toPublicUser(member), token }
  }

  function logout(token) {
    revokeSession(token)
    return { ok: true }
  }

  function listPublicMembers() {
    return allMembers().map(toPublicUser)
  }

  return {
    login,
    register,
    logout,
    getMeByToken,
    listPublicMembers,
  }
}

module.exports = { createAuthService }
