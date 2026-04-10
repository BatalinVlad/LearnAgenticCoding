import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'

export function BoardChatModal({ open, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, messages])

  function send() {
    const text = draft.trim()
    if (!text) return
    const label = user?.name?.trim() || user?.username || 'You'
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        author: label,
        text,
        at: Date.now(),
      },
    ])
    setDraft('')
  }

  if (!open) return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      data-bwignore="true"
    >
      <div
        className="modal-content board-chat-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-chat-title"
      >
        <div className="modal-header">
          <h2 id="board-chat-title" className="modal-title">
            Board chat
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
        <p className="board-chat-modal__hint">
          Messages stay in this browser only until a shared chat backend is added.
        </p>
        <div className="board-chat-modal__messages" ref={listRef} role="log" aria-live="polite">
          {messages.length === 0 ? (
            <p className="board-chat-modal__empty">No messages yet. Say hello below.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="board-chat-modal__msg">
                <span className="board-chat-modal__msg-author">{m.author}</span>
                <span className="board-chat-modal__msg-text">{m.text}</span>
              </div>
            ))
          )}
        </div>
        <div className="board-chat-modal__composer">
          <input
            type="text"
            name="board-chat-message"
            className="board-chat-modal__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Write a message…"
            autoComplete="off"
            aria-label="Message"
            {...inputAutofillIgnoreProps}
          />
          <button type="button" className="modal-btn modal-btn--primary" onClick={send}>
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
