import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LoginModal } from '../LoginModal/LoginModal'
import {
  getUserBoardAvatarGradient,
  getUserSoftGradientForeground,
} from '../../utils/userColorGradient'
import './UserNav.scss'

export function UserNav() {
  const { user, bootstrapped, login, logout, register } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <div className="user-nav">
        {!bootstrapped ? (
          <>
            <div className="user-nav__info">
              <span className="user-nav__name user-nav__name--muted">
                Loading…
              </span>
            </div>
          </>
        ) : user ? (
          <>
            <div className="user-nav__info">
              <span className="user-nav__name">{user.name}</span>
              <span className="user-nav__handle">@{user.username}</span>
            </div>
            <div
              className="user-nav__avatar user-nav__avatar--initials user-nav__avatar--soft-gradient"
              style={{
                backgroundImage: getUserBoardAvatarGradient(user.color, {
                  userId: user.id,
                }),
                color: getUserSoftGradientForeground(user.color, {
                  userId: user.id,
                }),
              }}
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
        onSignIn={login}
        onSignUp={register}
      />
    </>
  )
}
