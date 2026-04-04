import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(username: string, password: string) => Promise<{ ok: boolean, error?: string }>} props.onSignIn
 * @param {(data: { name: string, username: string, password: string }) => Promise<{ ok: boolean, error?: string }>} props.onSignUp
 */
export function LoginModal({ open, onClose, onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    setMode('signin')
    setName('')
    setUsername('')
    setPassword('')
    setError('')
    setPending(false)
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const u = username.trim()
    if (mode === 'signin') {
      if (!u || !password) {
        setError('Enter username and password.')
        return
      }
      setPending(true)
      try {
        const result = await onSignIn(u, password)
        if (result.ok) onClose?.()
        else setError(result.error || 'Could not sign in.')
      } finally {
        setPending(false)
      }
      return
    }

    const displayName = name.trim()
    if (!displayName || !u || !password) {
      setError('Enter your name, username, and password.')
      return
    }
    setPending(true)
    try {
      const result = await onSignUp({
        name: displayName,
        username: u,
        password,
      })
      if (result.ok) onClose?.()
      else setError(result.error || 'Could not create account.')
    } finally {
      setPending(false)
    }
  }

  const title = mode === 'signin' ? 'Sign in' : 'Create account'
  const primaryLabel =
    mode === 'signin'
      ? pending
        ? 'Signing in…'
        : 'Sign in'
      : pending
        ? 'Creating…'
        : 'Create account'

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content login-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <div className="modal-header">
          <h2 id="login-modal-title" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <form className="login-modal__form" onSubmit={handleSubmit}>
          <div className="modal-body login-modal__body">
            {mode === 'signup' ? (
              <>
                <label className="login-modal__label" htmlFor="auth-name">
                  Full name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  className="login-modal__input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={pending}
                  placeholder="Jane Doe"
                />
              </>
            ) : null}
            <label className="login-modal__label" htmlFor="auth-username">
              Username
            </label>
            <input
              id="auth-username"
              name="username"
              className="login-modal__input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
              {...inputAutofillIgnoreProps}
            />
            <label className="login-modal__label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              className="login-modal__input"
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
            {error ? (
              <p className="login-modal__error" role="alert">
                {error}
              </p>
            ) : null}
            <p className="login-modal__switch">
              {mode === 'signin' ? (
                <>
                  No account?{' '}
                  <button
                    type="button"
                    className="login-modal__switch-btn"
                    onClick={() => {
                      setMode('signup')
                      setError('')
                    }}
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="login-modal__switch-btn"
                    onClick={() => {
                      setMode('signin')
                      setError('')
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn--cancel"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn--primary"
              disabled={pending}
            >
              {primaryLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
