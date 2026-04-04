import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  authLogin,
  authLogout,
  authRegister,
  fetchAuthMe,
  fetchAuthMembers,
} from '../api/auth'

const TOKEN_KEY = 'board-auth-token'
/** Legacy keys from client-only auth — cleared once on load */
const LEGACY_USER_ID_KEY = 'board-auth-user-id'
const LEGACY_REGISTERED_KEY = 'board-users-registered'

const AuthContext = createContext(null)

function readToken() {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function persistToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [members, setMembers] = useState([])
  const [user, setUser] = useState(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_USER_ID_KEY)
      localStorage.removeItem(LEGACY_REGISTERED_KEY)
    } catch {
      /* ignore */
    }

    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchAuthMembers()
        if (cancelled) return
        setMembers(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setMembers([])
      }

      const token = readToken()
      if (!token) {
        if (!cancelled) {
          setUser(null)
          setBootstrapped(true)
        }
        return
      }

      try {
        const me = await fetchAuthMe(token)
        if (cancelled) return
        if (me) {
          setUser(me)
        } else {
          persistToken(null)
          setUser(null)
        }
      } catch {
        if (!cancelled) {
          persistToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setBootstrapped(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const findMemberById = useCallback(
    (id) => {
      const n = Number(id)
      if (!Number.isFinite(n)) return null
      return members.find((m) => m.id === n) ?? null
    },
    [members],
  )

  const refreshMembers = useCallback(async () => {
    try {
      const list = await fetchAuthMembers()
      setMembers(Array.isArray(list) ? list : [])
    } catch {
      /* keep previous members */
    }
  }, [])

  /**
   * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
   */
  const login = useCallback(async (username, password) => {
    try {
      const { user: next, token } = await authLogin(username, password)
      persistToken(token)
      setUser(next)
      await refreshMembers()
      return { ok: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not sign in.'
      return { ok: false, error: message }
    }
  }, [refreshMembers])

  /**
   * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
   */
  const register = useCallback(
    async ({ name, username, password }) => {
      try {
        const { user: next, token } = await authRegister({
          name,
          username,
          password,
        })
        persistToken(token)
        setUser(next)
        await refreshMembers()
        return { ok: true }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not create account.'
        return { ok: false, error: message }
      }
    },
    [refreshMembers],
  )

  const logout = useCallback(async () => {
    const token = readToken()
    await authLogout(token)
    persistToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      members,
      bootstrapped,
      findMemberById,
      login,
      register,
      logout,
    }),
    [user, members, bootstrapped, findMemberById, login, register, logout],
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
