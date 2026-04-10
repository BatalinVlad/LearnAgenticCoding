import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ProgressFooter } from '../ProgressFooter/ProgressFooter'
import { checklistStats } from '../../hooks/useTodos'
import { Spinner } from '../Spinner/Spinner'
import { ConfettiCelebration } from '../ConfettiCelebration/ConfettiCelebration'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'
import { toDateInputValue } from '../../utils/dueDateUtils'
import { CardLabelSwatches } from '../CardLabelSwatches/CardLabelSwatches'
import { CardAssigneeSelect } from '../CardAssigneeSelect/CardAssigneeSelect'
import { isValidCardLabelId } from '../../constants/cardLabels'

export function CardModal({
  card,
  photoError,
  onClose,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateCardLabel,
  onUpdateCardAssignee,
  onUpdateDueDate,
  onAddChecklistItem,
  onToggleChecklistItem,
  onUpdateChecklistItemText,
  onRemoveChecklistItem,
  onDeleteCard,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  isPhotoLoading,
}) {
  const [title, setTitle] = useState(card.text)
  const [cardDescription, setCardDescription] = useState(
    () => card.description ?? '',
  )
  const [dueDateDraft, setDueDateDraft] = useState(() =>
    toDateInputValue(card.dueDate),
  )
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    setTitle(card.text)
  }, [card.id, card.text])

  useEffect(() => {
    setCardDescription(card.description ?? '')
  }, [card.id, card.description])

  useEffect(() => {
    setDueDateDraft(toDateInputValue(card.dueDate))
  }, [card.id, card.dueDate])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const { total, doneCount, percent } = checklistStats(card.checklist)
  const checklist = Array.isArray(card.checklist) ? card.checklist : []
  const isComplete = total > 0 && doneCount === total

  const [showConfetti, setShowConfetti] = useState(false)
  const prevIsComplete = useRef(isComplete)

  useEffect(() => {
    if (isComplete && !prevIsComplete.current) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
    prevIsComplete.current = isComplete
  }, [isComplete])

  function commitTitle() {
    const t = title.trim()
    if (t && t !== card.text) onUpdateTitle(card.id, t)
    else setTitle(card.text)
  }

  function commitDescription() {
    const prev = card.description ?? ''
    if (cardDescription !== prev) onUpdateDescription(card.id, cardDescription)
    else setCardDescription(prev)
  }

  function handleDueDateChange(e) {
    const v = e.target.value
    setDueDateDraft(v)
    const next = v === '' ? null : v
    const prev = card.dueDate ?? null
    if (next !== prev) onUpdateDueDate(card.id, next)
  }

  function clearDueDate() {
    setDueDateDraft('')
    if (card.dueDate != null) onUpdateDueDate(card.id, null)
  }

  function handleAddChecklist(e) {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    onAddChecklistItem(card.id, t)
    setDraft('')
  }

  function commitEdit(itemId) {
    const t = editingText.trim()
    const prev = checklist.find((c) => c.id === itemId)?.text ?? ''
    if (!t) {
      setEditingId(null)
      return
    }
    if (t !== prev) {
      onUpdateChecklistItemText(card.id, itemId, t)
    }
    setEditingId(null)
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose} data-bwignore="true">
      <div
        className="modal-content card-modal"
        data-bwignore="true"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        style={{ position: 'relative' }}
      >
        {showConfetti ? <ConfettiCelebration /> : null}
        <div className="modal-header card-modal__header">
          <h2
            id="card-modal-title"
            className="modal-title card-modal__heading"
            title={(title.trim() || card.text) || undefined}
          >
            {title.trim() || card.text || 'Untitled card'}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className="modal-body card-modal__body"
          data-bwignore="true"
          translate="no"
        >
          <label className="card-modal__label" htmlFor="card-title-input">
            Title
          </label>
          <input
            id="card-title-input"
            name="card-title"
            type="text"
            className="card-modal__title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            placeholder="Enter a title for this card..."
            spellCheck={false}
            {...inputAutofillIgnoreProps}
            autoComplete="off"
          />

          <div className="card-modal__label-section">
            <span className="card-modal__label" id="card-modal-label-heading">
              Label
            </span>
            <CardLabelSwatches
              className="card-modal__label-swatches"
              selectedId={
                isValidCardLabelId(card.label) ? Number(card.label) : null
              }
              onSelect={(id) => onUpdateCardLabel(card.id, id)}
            />
          </div>

          <CardAssigneeSelect
            value={card.assigneeId}
            onChange={(id) => onUpdateCardAssignee(card.id, id)}
            idPrefix={`card-modal-assignee-${card.id}`}
            className="card-modal__assignee-section"
          />

          <label className="card-modal__label" htmlFor="card-description-input">
            Description
          </label>
          <textarea
            id="card-description-input"
            name="card-description"
            className="card-modal__description-input"
            value={cardDescription}
            onChange={(e) => setCardDescription(e.target.value)}
            onBlur={commitDescription}
            placeholder="Add a description..."
            rows={4}
            spellCheck={false}
            {...inputAutofillIgnoreProps}
            autoComplete="off"
          />

          <div className="card-modal__due-row">
            <label className="card-modal__label" htmlFor="card-due-date-input">
              Due date
            </label>
            <div className="card-modal__due-controls">
              <input
                id="card-due-date-input"
                name="card-due-date"
                type="date"
                className="card-modal__due-input"
                value={dueDateDraft}
                onChange={handleDueDateChange}
                {...inputAutofillIgnoreProps}
                autoComplete="off"
              />
              {dueDateDraft ? (
                <button
                  type="button"
                  className="card-modal__due-clear"
                  onClick={clearDueDate}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {photoError ? (
            <p className="action-error card-modal__photo-error" role="alert">
              {photoError}
            </p>
          ) : null}

          {card.photo || isPhotoLoading ? (
            <div className="card-modal__cover">
              {card.photo ? (
                <button
                  type="button"
                  className="card-modal__cover-btn"
                  onClick={() => onViewPhoto(card.photo)}
                  style={{ position: 'relative' }}
                >
                  <img src={card.photo} alt="Card cover" className="card-modal__cover-img" />
                  {isPhotoLoading ? (
                    <div className="card__thumb-loading">
                      <Spinner size={32} />
                    </div>
                  ) : null}
                </button>
              ) : (
                <div className="card-modal__cover-btn" style={{ minHeight: '120px', position: 'relative' }}>
                  {isPhotoLoading ? (
                    <div className="card__thumb-loading">
                      <Spinner size={32} />
                    </div>
                  ) : null}
                </div>
              )}
              <div className="card-modal__cover-actions">
                <label className="card-modal__link-btn">
                  Change photo
                  <input
                    id={`card-photo-change-input-${card.id}`}
                    name="card-photo-change"
                    type="file"
                    accept="image/*"
                    className="photo-input"
                    onChange={(e) => onPhotoChange(card.id, e)}
                  />
                </label>
                <button
                  type="button"
                  className="card-modal__link-btn card-modal__link-btn--danger"
                  onClick={() => onRemovePhoto(card.id)}
                >
                  Remove photo
                </button>
              </div>
            </div>
          ) : (
            <label className="card-modal__link-btn card-modal__add-cover">
              Add cover photo
              <input
                id={`card-photo-add-input-${card.id}`}
                name="card-photo-add"
                type="file"
                accept="image/*"
                className="photo-input"
                onChange={(e) => onPhotoChange(card.id, e)}
              />
            </label>
          )}

          <h3 className="card-modal__section-title">Checklist</h3>
          <ul className="card-modal__checklist">
            {checklist.map((c) => (
              <li key={c.id} className="card-modal__check-row">
                <input
                  id={`card-checklist-done-${c.id}`}
                  name="card-checklist-done"
                  type="checkbox"
                  checked={c.done}
                  onChange={(e) =>
                    onToggleChecklistItem(card.id, c.id, e.target.checked)
                  }
                  aria-label={c.done ? 'Mark not done' : 'Mark done'}
                />
                {editingId === c.id ? (
                  <input
                    type="text"
                    id={`checklist-item-edit-${c.id}`}
                    name="checklist-item-edit"
                    className="card-modal__check-edit"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => commitEdit(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitEdit(c.id)
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null)
                        setEditingText(c.text)
                      }
                    }}
                    autoFocus
                    {...inputAutofillIgnoreProps}
                  />
                ) : (
                  <button
                    type="button"
                    className={
                      'card-modal__check-label' + (c.done ? ' is-done' : '')
                    }
                    onClick={() => {
                      setEditingId(c.id)
                      setEditingText(c.text)
                    }}
                  >
                    {c.text}
                  </button>
                )}
                <button
                  type="button"
                  className="card-modal__check-remove"
                  onClick={() => onRemoveChecklistItem(card.id, c.id)}
                  aria-label="Remove item"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <form
            className="card-modal__add"
            autoComplete="off"
            data-bwignore="true"
            onSubmit={handleAddChecklist}
          >
            <input
              type="text"
              id="card-checklist-new-item-input"
              name="card-checklist-new-item"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add an item to this card's checklist..."
              {...inputAutofillIgnoreProps}
            />
            <button type="submit" className="btn-add">
              Add
            </button>
          </form>

          <ProgressFooter
            percent={percent}
            labelRight={
              total === 0
                ? 'No checklist items yet'
                : `${doneCount} of ${total} completed`
            }
          />
        </div>

        <div className="modal-footer card-modal__footer">
          <button
            type="button"
            className="modal-btn modal-btn--danger"
            onClick={() => {
              onDeleteCard(card.id)
              onClose()
            }}
          >
            Delete card
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
