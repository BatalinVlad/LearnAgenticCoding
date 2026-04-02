import { useEffect, useState } from 'react'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'

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
        </div>
      </header>
      <section className="main-board">{children}</section>
    </>
  )
}
