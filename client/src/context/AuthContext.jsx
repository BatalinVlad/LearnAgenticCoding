import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {
  BOARD_MEMBERS,
  findMemberByCredentials,
  findMemberById,
  toPublicUser,
} from '../data/boardUsers'

const STORAGE_KEY = 'board-auth-user-id'

const AuthContext = createContext(null)

function persistSession(user) {
  try {
    if (user === null) localStorage.setItem(STORAGE_KEY, 'logged-out')
    else localStorage.setItem(STORAGE_KEY, String(user.id))
  } catch {
    /* ignore */
  }
}

function readSessionSync() {
  if (typeof window === 'undefined') return toPublicUser(BOARD_MEMBERS[0])
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'logged-out') return null
    if (raw) {
      const id = parseInt(raw, 10)
      const m = findMemberById(id)
      if (m) return toPublicUser(m)
      return toPublicUser(BOARD_MEMBERS[0])
    }
    const u = toPublicUser(BOARD_MEMBERS[0])
    persistSession(u)
    return u
  } catch {
    return toPublicUser(BOARD_MEMBERS[0])
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSessionSync)

  /**
   * Swap for `fetch('/api/login', ...)` later; keep the same return shape.
   * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
   */
  const login = useCallback(async (username, password) => {
    await new Promise((r) => setTimeout(r, 120))
    const member = findMemberByCredentials(username, password)
    if (!member) {
      return { ok: false, error: 'Invalid username or password.' }
    }
    const next = toPublicUser(member)
    setUser(next)
    persistSession(next)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    persistSession(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, logout }),
    [user, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
