import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LoginModal } from '../LoginModal/LoginModal'
import './UserNav.scss'

function avatarBg(id) {
  return `hsl(${(id * 137.5) % 360}, 70%, 50%)`
}

export function UserNav() {
  const { user, login, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <div className="user-nav">
        {user ? (
          <>
            <div className="user-nav__info">
              <span className="user-nav__name">{user.name}</span>
              <span className="user-nav__handle">@{user.username}</span>
            </div>
            <div
              className="user-nav__avatar user-nav__avatar--initials"
              style={{ backgroundColor: avatarBg(user.id) }}
              aria-hidden
            >
              {user.initials}
            </div>
            <button
              type="button"
              className="user-nav__auth-btn"
              onClick={logout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <div className="user-nav__info">
              <span className="user-nav__name user-nav__name--muted">
                Not signed in
              </span>
            </div>
            <button
              type="button"
              className="user-nav__auth-btn"
              onClick={() => setLoginOpen(true)}
            >
              Log in
            </button>
          </>
        )}
      </div>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSubmit={login}
      />
    </>
  )
}
