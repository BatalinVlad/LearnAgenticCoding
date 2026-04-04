import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { checklistStats } from '../../hooks/useTodos'
import { Spinner } from '../Spinner/Spinner'
import {
  formatDueDateShort,
  isDueDateOverdue,
  isDueDateToday,
} from '../../utils/dueDateUtils'
import { CardLabelSwatches } from '../CardLabelSwatches/CardLabelSwatches'
import { CardAssigneeSelect } from '../CardAssigneeSelect/CardAssigneeSelect'
import { isValidCardLabelId } from '../../constants/cardLabels'
import { useAuth } from '../../context/AuthContext'
import {
  getUserBoardAvatarGradient,
  getUserSoftGradientForeground,
} from '../../utils/userColorGradient'

function CardMenuOptions({
  item,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  onCardLabelChange,
  onAssigneeChange,
  onDuplicate,
  onDelete,
}) {
  return (
    <>
      <div className="card-menu__label-block">
        <div className="card-menu__label-heading" id={`card-menu-label-${item.id}`}>
          Label
        </div>
        <CardLabelSwatches
          className="card-menu__label-swatches"
          selectedId={
            isValidCardLabelId(item.label) ? Number(item.label) : null
          }
          onSelect={(id) => onCardLabelChange(id)}
        />
      </div>
      <div className="card-menu__assignee-block">
        <div className="card-menu__label-heading">Assignee</div>
        <CardAssigneeSelect
          showLabel={false}
          value={item.assigneeId}
          onChange={onAssigneeChange}
          idPrefix={`card-menu-assignee-${item.id}`}
          selectClassName="card-assignee-select--menu"
        />
      </div>
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
        className="card-menu__option"
        role="menuitem"
        onClick={() => onDuplicate(item.id)}
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
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Duplicate card</span>
        </span>
      </button>
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
    </>
  )
}

export function Card({
  innerRef,
  draggableProps,
  dragHandleProps,
  item,
  isDragging,
  isPhotoLoading,
  menuOpen,
  onToggleMenu,
  onOpenCard,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  onDuplicate,
  onDelete,
  onUpdateCardLabel,
  onUpdateCardAssignee,
}) {
  const { findMemberById } = useAuth()
  const { total, doneCount } = checklistStats(item.checklist)
  const hasDescription = String(item.description ?? '').trim().length > 0
  const showMeta = Boolean(item.dueDate) || hasDescription
  const showChecklist = total > 0
  const rawAssigneeId = item.assigneeId
  const assigneeIdNum =
    rawAssigneeId == null || rawAssigneeId === ''
      ? NaN
      : Number(rawAssigneeId)
  const assignee = Number.isFinite(assigneeIdNum)
    ? findMemberById(assigneeIdNum)
    : null
  const showAssignee = assignee != null
  const showFooter = showMeta || showChecklist || showAssignee

  const triggerRef = useRef(null)
  const [menuPos, setMenuPos] = useState(null)

  /* eslint-disable react-hooks/set-state-in-effect -- menu portal: measure trigger with getBoundingClientRect */
  useLayoutEffect(() => {
    if (!menuOpen || isDragging) {
      setMenuPos(null)
      return
    }
    function updatePosition() {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, left: rect.right })
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [menuOpen, isDragging])
  /* eslint-enable react-hooks/set-state-in-effect */

  const menuOptionsProps = {
    item,
    onViewPhoto,
    onPhotoChange,
    onRemovePhoto,
    onCardLabelChange: (label) => onUpdateCardLabel(item.id, label),
    onAssigneeChange: (id) => onUpdateCardAssignee(item.id, id),
    onDuplicate,
    onDelete,
  }

  const labelClass =
    isValidCardLabelId(item.label) ? ` card--label-${item.label}` : ''

  const itemNode = (
    <li
      ref={innerRef}
      {...draggableProps}
      className={
        'item card' +
        labelClass +
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
          {item.photo || isPhotoLoading ? (
            <span className="card__thumb-wrap">
              {item.photo ? <img src={item.photo} alt="" className="card__thumb" /> : null}
              {isPhotoLoading ? (
                <span className="card__thumb-loading">
                  <Spinner size={20} />
                </span>
              ) : null}
            </span>
          ) : null}
          <span className="card__title">{item.text}</span>
          {showFooter ? (
            <div className="card__footer">
              <div className="card__footer-main">
              {showMeta ? (
                <div className="card__meta">
                {item.dueDate ? (
                  <span
                    className={
                      'card__meta-item card__due' +
                      (isDueDateOverdue(item.dueDate)
                        ? ' card__due--overdue'
                        : '') +
                      (isDueDateToday(item.dueDate) ? ' card__due--today' : '')
                    }
                    title={`Due ${formatDueDateShort(item.dueDate)}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="card__meta-icon"
                      aria-hidden
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="card__due-text">
                      {formatDueDateShort(item.dueDate)}
                    </span>
                  </span>
                ) : null}
                {hasDescription ? (
                  <span
                    className="card__meta-item card__meta-item--desc"
                    title="Has description"
                    aria-label="Has description"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="card__meta-icon"
                      aria-hidden
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                  </span>
                ) : null}
                </div>
              ) : null}
              {showChecklist ? (
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
              ) : null}
              </div>
              {showAssignee ? (
                <span
                  className="card__assignee"
                  title={`${assignee.name} (@${assignee.username})`}
                >
                  <span
                    className="card__assignee-avatar"
                    style={{
                      backgroundImage: getUserBoardAvatarGradient(assignee.color, {
                        userId: assignee.id,
                      }),
                      color: getUserSoftGradientForeground(assignee.color, {
                        userId: assignee.id,
                      }),
                    }}
                  >
                    {assignee.initials}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}
        </button>
        <div
          className="card-menu"
          data-card-menu
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={triggerRef}
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
            isDragging ? (
              <div className="card-menu__dropdown" role="menu">
                <CardMenuOptions {...menuOptionsProps} />
              </div>
            ) : menuPos ? (
              createPortal(
                <div
                  className="card-menu__dropdown card-menu__dropdown--portal"
                  role="menu"
                  data-card-menu
                  style={{
                    top: menuPos.top,
                    left: menuPos.left,
                  }}
                >
                  <CardMenuOptions {...menuOptionsProps} />
                </div>,
                document.body,
              )
            ) : null
          ) : null}
        </div>
      </div>
    </li>
  )

  return isDragging ? createPortal(itemNode, document.body) : itemNode
}
