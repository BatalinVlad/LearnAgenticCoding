import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'
import {
  getUserBoardAvatarGradient,
  getUserSoftGradientForeground,
} from '../../utils/userColorGradient'
import { UserNav } from '../UserNav/UserNav'

export function MainBoard({
  title,
  onTitleChange,
  cardFilter,
  onCardFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  onOpenBackgroundPicker,
  onOpenBoardHistory,
  onOpenBoardChat,
  children,
}) {
  const [titleDraft, setTitleDraft] = useState(title)

  useEffect(() => {
    setTitleDraft(title)
  }, [title])

  function commitTitle() {
    const t = titleDraft.trim()
    if (t && t !== title) onTitleChange?.(t)
    else setTitleDraft(title)
  }

  const { members: boardMembers } = useAuth()
  const maxUsers = 3
  const visibleUsers = boardMembers.slice(0, maxUsers)
  const hiddenCount = boardMembers.length - maxUsers
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const filterMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUsersMenuOpen(false)
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false)
      }
    }
    
    if (isUsersMenuOpen || isFilterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUsersMenuOpen, isFilterMenuOpen])

  return (
    <>
      <header className="app-header" data-bwignore="true">
        <div className="app-header__top">
          <div className="app-header__title-wrap">
            <input
              type="text"
              id="board-title-input"
              className="board-title-input"
              name="board-title"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              aria-label="Board title"
              spellCheck={false}
              translate="no"
              {...inputAutofillIgnoreProps}
            />
          </div>
          
          <div className="app-header__top-right">
            <div className="board-users" style={{ position: 'relative' }} ref={menuRef}>
              <button 
                type="button" 
                className="board-users__trigger" 
                style={{ 
                  display: 'flex', 
                  background: 'transparent', 
                  border: 'none', 
                  padding: 0, 
                  cursor: 'pointer',
                  alignItems: 'center'
                }}
                onClick={() => setIsUsersMenuOpen(prev => !prev)}
                aria-expanded={isUsersMenuOpen}
                aria-haspopup="menu"
              >
                {visibleUsers.map((user, index) => (
                  <div 
                    key={user.id} 
                    className="board-users__avatar board-users__avatar--gradient" 
                    title={`${user.name} (@${user.username})`}
                    style={{ 
                      backgroundImage: getUserBoardAvatarGradient(user.color, {
                        userId: user.id,
                      }),
                      color: getUserSoftGradientForeground(user.color, {
                        userId: user.id,
                      }),
                      zIndex: visibleUsers.length - index
                    }}
                  >
                    {user.initials}
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <div 
                    className="board-users__avatar board-users__avatar--more" 
                    title={`+${hiddenCount} more members`}
                    style={{ zIndex: 0 }}
                  >
                    +{hiddenCount}
                  </div>
                )}
              </button>
              
              {isUsersMenuOpen && (
                <div 
                  className="board-users-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--ds-surface-overlay, #fff)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    border: '1px solid var(--ds-border)',
                    width: '260px',
                    zIndex: 1000,
                    padding: '12px'
                  }}
                  role="menu"
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ds-text-subtle)', marginBottom: '8px', textAlign: 'center' }}>
                    Board Members
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '300px', overflowY: 'auto' }}>
                    {boardMembers.map((user) => (
                      <div key={user.id} className="board-dropdown-item" role="menuitem">
                        <div 
                          className="board-users__avatar"
                          style={{ 
                            backgroundImage: getUserBoardAvatarGradient(user.color, {
                              userId: user.id,
                            }),
                            color: getUserSoftGradientForeground(user.color, {
                              userId: user.id,
                            }),
                            margin: 0
                          }}
                        >
                          {user.initials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--ds-text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ds-text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{user.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <UserNav />
          </div>
        </div>

        <div className="app-header__bottom">
          <div className="app-header__actions">
            <button
              type="button"
              className="app-header__bg-btn"
              onClick={onOpenBackgroundPicker}
              aria-haspopup="dialog"
            >
              Change background
            </button>
            <input
              type="text"
              id="board-filter-input"
              inputMode="search"
              enterKeyHint="search"
              className="app-header__filter"
              name="filter-cards"
              value={cardFilter}
              onChange={(e) => onCardFilterChange?.(e.target.value)}
              placeholder="filter cards"
              aria-label="Filter cards by title"
              spellCheck={false}
              {...inputAutofillIgnoreProps}
            />
            <div className="app-header__filter-dropdown" style={{ position: 'relative' }} ref={filterMenuRef}>
              <button
                type="button"
                className="app-header__filter"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: '150px'
                }}
                onClick={() => setIsFilterMenuOpen(prev => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isFilterMenuOpen}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {assigneeFilter === 'unassigned' 
                    ? 'Unassigned' 
                    : assigneeFilter 
                      ? boardMembers.find(m => String(m.id) === String(assigneeFilter))?.name ?? 'Unknown'
                      : 'All assignees'}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {isFilterMenuOpen && (
                <div 
                  className="board-filter-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    background: 'var(--ds-surface-overlay, #fff)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                    border: '1px solid var(--ds-border)',
                    width: '100%',
                    minWidth: '150px',
                    zIndex: 1000,
                    padding: '8px 0'
                  }}
                  role="listbox"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0 4px', gap: '2px', maxHeight: '300px', overflowY: 'auto' }}>
                    <button 
                      type="button"
                      className={`board-dropdown-item ${!assigneeFilter ? 'board-dropdown-item--selected' : ''}`}
                      onClick={() => {
                        onAssigneeFilterChange?.('')
                        setIsFilterMenuOpen(false)
                      }}
                      role="option"
                      aria-selected={!assigneeFilter}
                    >
                      All assignees
                    </button>
                    <button 
                      type="button"
                      className={`board-dropdown-item ${assigneeFilter === 'unassigned' ? 'board-dropdown-item--selected' : ''}`}
                      onClick={() => {
                        onAssigneeFilterChange?.('unassigned')
                        setIsFilterMenuOpen(false)
                      }}
                      role="option"
                      aria-selected={assigneeFilter === 'unassigned'}
                    >
                      Unassigned
                    </button>
                    <div style={{ height: '1px', background: 'var(--ds-border)', margin: '4px 0' }} />
                    {boardMembers.map((m) => (
                      <button 
                        key={m.id}
                        type="button"
                        className={`board-dropdown-item ${String(assigneeFilter) === String(m.id) ? 'board-dropdown-item--selected' : ''}`}
                        onClick={() => {
                          onAssigneeFilterChange?.(String(m.id))
                          setIsFilterMenuOpen(false)
                        }}
                        role="option"
                        aria-selected={String(assigneeFilter) === String(m.id)}
                      >
                        <div 
                          className="board-users__avatar"
                          style={{ 
                            backgroundImage: getUserBoardAvatarGradient(m.color, {
                              userId: m.id,
                            }),
                            color: getUserSoftGradientForeground(m.color, {
                              userId: m.id,
                            }),
                            margin: 0,
                            width: '24px',
                            height: '24px',
                            fontSize: '0.65rem'
                          }}
                        >
                          {m.initials}
                        </div>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="app-header__bottom-right">
            <button
              type="button"
              className="app-header__bg-btn"
              onClick={() => onOpenBoardHistory?.()}
            >
              Board history
            </button>
            <button
              type="button"
              className="app-header__bg-btn"
              onClick={() => onOpenBoardChat?.()}
            >
              Chat
            </button>
          </div>
        </div>
      </header>
      <section className="main-board">{children}</section>
    </>
  )
}
