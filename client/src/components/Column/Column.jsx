import { useEffect, useState } from 'react'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'

export function Column({
  title,
  titleInputId,
  onTitleChange,
  onDeleteColumn,
  canDelete,
  columnDragHandleProps,
  isColumnDragging,
  children,
}) {
  const [value, setValue] = useState(title)

  useEffect(() => {
    setValue(title)
  }, [title])

  function commit() {
    const t = value.trim()
    if (t && t !== title) onTitleChange?.(t)
    else setValue(title)
  }

  return (
    <article
      className={
        'board-column' + (isColumnDragging ? ' board-column--dragging' : '')
      }
    >
      {columnDragHandleProps ? (
        <div
          className="column-drag-handle"
          {...columnDragHandleProps}
          aria-label="Drag to reorder column"
          title="Drag to reorder column"
        >
          <svg
            width="24"
            height="8"
            viewBox="0 0 24 8"
            fill="currentColor"
            aria-hidden
          >
            <circle cx="2" cy="4" r="1.5" />
            <circle cx="6" cy="4" r="1.5" />
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="14" cy="4" r="1.5" />
            <circle cx="18" cy="4" r="1.5" />
            <circle cx="22" cy="4" r="1.5" />
          </svg>
        </div>
      ) : null}
      <div className="board-column__header">
        <input
          type="text"
          id={titleInputId}
          name="column-title"
          className="column-title column-title-input column-title-input--grow"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          aria-label="Column title"
          spellCheck={false}
          {...inputAutofillIgnoreProps}
        />
        {canDelete ? (
          <button
            type="button"
            className="column-delete-btn"
            onClick={onDeleteColumn}
            title="Delete column"
            aria-label="Delete column"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        ) : null}
      </div>
      {children}
    </article>
  )
}
