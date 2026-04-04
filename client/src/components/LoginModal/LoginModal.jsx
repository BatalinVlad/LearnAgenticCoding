import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'

export function LoginModal({ open, onClose, onSubmit }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
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
    if (!u || !password) {
      setError('Enter username and password.')
      return
    }
    setPending(true)
    try {
      const result = await onSubmit(u, password)
      if (result.ok) onClose?.()
      else setError(result.error || 'Could not sign in.')
    } finally {
      setPending(false)
    }
  }

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
            Sign in
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
            <label className="login-modal__label" htmlFor="login-username">
              Username
            </label>
            <input
              id="login-username"
              name="username"
              className="login-modal__input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
              {...inputAutofillIgnoreProps}
            />
            <label className="login-modal__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              className="login-modal__input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
            {error ? (
              <p className="login-modal__error" role="alert">
                {error}
              </p>
            ) : null}
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
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
