import { createPortal } from 'react-dom'
import { checklistStats } from '../../hooks/useTodos'
import {
  formatDueDateShort,
  isDueDateOverdue,
  isDueDateToday,
} from '../../dueDateUtils'

export function Card({
  innerRef,
  draggableProps,
  dragHandleProps,
  item,
  isDragging,
  menuOpen,
  onToggleMenu,
  onOpenCard,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  onDelete,
}) {
  const { total, doneCount, percent } = checklistStats(item.checklist)

  const itemNode = (
    <li
      ref={innerRef}
      {...draggableProps}
      className={
        'item card' +
        (isDragging ? ' dragging' : '') +
        (menuOpen ? ' card-menu-open' : '')
      }
    >
      <div className="card__drag-shell" {...dragHandleProps}>
        <button
          type="button"
          className="card__open"
          onClick={() => onOpenCard(item)}
        >
          {item.photo ? (
            <span className="card__thumb-wrap">
              <img src={item.photo} alt="" className="card__thumb" />
            </span>
          ) : null}
          <span className="card__title">{item.text}</span>
          {item.dueDate ? (
            <span
              className={
                'card__due' +
                (isDueDateOverdue(item.dueDate) ? ' card__due--overdue' : '') +
                (isDueDateToday(item.dueDate) ? ' card__due--today' : '')
              }
              title="Due date"
            >
              {formatDueDateShort(item.dueDate)}
            </span>
          ) : null}
          {total > 0 ? (
            <span
              className="card__progress"
              aria-label={`${doneCount} of ${total} checklist items done`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="card__progress-icon" aria-hidden>
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className="card__progress-meta">
                {doneCount}/{total}
              </span>
            </span>
          ) : (
            <span className="card__hint">Open to add a checklist</span>
          )}
        </button>
        <div
          className="card-menu"
          data-card-menu
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="card-menu__trigger"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Card actions"
            title="Card actions"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden
            >
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {menuOpen ? (
            <div className="card-menu__dropdown" role="menu">
              {item.photo ? (
                <button
                  type="button"
                  className="card-menu__option"
                  role="menuitem"
                  onClick={() => onViewPhoto(item.photo)}
                >
                  <span className="card-menu__option-content">
                    <svg
                      className="card-menu__icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>View cover</span>
                  </span>
                </button>
              ) : null}
              <label className="card-menu__option card-menu__option--file">
                <span className="card-menu__option-content">
                  <svg
                    className="card-menu__icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  <span>{item.photo ? 'Change cover' : 'Add cover'}</span>
                </span>
                <input
                  id={`card-menu-photo-input-${item.id}`}
                  name="card-menu-photo"
                  type="file"
                  accept="image/*"
                  className="photo-input"
                  onChange={(e) => onPhotoChange(item.id, e)}
                />
              </label>
              {item.photo ? (
                <button
                  type="button"
                  className="card-menu__option"
                  role="menuitem"
                  onClick={() => onRemovePhoto(item.id)}
                >
                  <span className="card-menu__option-content">
                    <svg
                      className="card-menu__icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                    <span>Remove cover</span>
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                className="card-menu__option card-menu__option--danger"
                role="menuitem"
                onClick={() => onDelete(item.id)}
              >
                <span className="card-menu__option-content">
                  <svg
                    className="card-menu__icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span>Delete card</span>
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )

  return isDragging ? createPortal(itemNode, document.body) : itemNode
}
