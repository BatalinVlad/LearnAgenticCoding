import { useEffect, useState } from 'react'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'
import { UserNav } from '../UserNav/UserNav'

const DUMMY_BOARD_MEMBERS = [
  { id: 1, username: 'vbatalin', name: 'Vlad Batalin', initials: 'VB', password: 'password', tasks: ['task-1', 'task-2'] },
  { id: 2, username: 'johndoe', name: 'John Doe', initials: 'JD', password: 'password', tasks: ['task-3'] },
  { id: 3, username: 'sarahsmith', name: 'Sarah Smith', initials: 'SS', password: 'password', tasks: [] },
]

export function MainBoard({
  title,
  onTitleChange,
  cardFilter,
  onCardFilterChange,
  onOpenBackgroundPicker,
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

  return (
    <>
      <header className="app-header" data-bwignore="true">
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
        
        <div className="board-users">
          {DUMMY_BOARD_MEMBERS.map(user => (
            <div 
              key={user.id} 
              className="board-users__avatar" 
              title={`${user.name} (@${user.username})`}
              style={{ backgroundColor: `hsl(${(user.id * 137.5) % 360}, 70%, 50%)` }}
            >
              {user.initials}
            </div>
          ))}
        </div>

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
          <UserNav />
        </div>
      </header>
      <section className="main-board">{children}</section>
    </>
  )
}
