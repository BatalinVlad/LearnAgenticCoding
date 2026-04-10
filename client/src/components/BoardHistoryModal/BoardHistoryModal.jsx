import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

export function BoardHistoryModal({ open, onClose, columns, todos }) {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const rows = useMemo(() => {
    const byCol = new Map(columns.map((c) => [c.id, { title: c.title, count: 0 }]))
    for (const t of todos) {
      const row = byCol.get(t.columnId)
      if (row) row.count += 1
    }
    return columns.map((c) => ({
      id: c.id,
      title: c.title,
      count: byCol.get(c.id)?.count ?? 0,
    }))
  }, [columns, todos])

  if (!open) return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      data-bwignore="true"
    >
      <div
        className="modal-content board-history-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-history-title"
      >
        <div className="modal-header">
          <h2 id="board-history-title" className="modal-title">
            Board history
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="modal-body board-history-modal__body">
          <p className="board-history-modal__intro">
            The API does not store an activity log yet. Here is a snapshot of cards per column on this board.
          </p>
          <ul className="board-history-modal__list">
            {rows.map((r) => (
              <li key={r.id} className="board-history-modal__row">
                <span className="board-history-modal__col-title">{r.title}</span>
                <span className="board-history-modal__count">{r.count} cards</span>
              </li>
            ))}
          </ul>
          <p className="board-history-modal__total">
            <strong>{todos.length}</strong> total cards
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="modal-btn modal-btn--cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
