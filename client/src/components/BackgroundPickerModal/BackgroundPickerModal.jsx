import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from '../Spinner/Spinner'

export function BackgroundPickerModal({
  open,
  onClose,
  photos,
  loading,
  error,
  searchQuery,
  onSearch,
  onSelectPhoto,
  onUseDefault,
  onShuffleAnimated,
}) {
  const [searchValue, setSearchValue] = useState(searchQuery || '')

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    setSearchValue(searchQuery || '')
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, searchQuery])

  if (!open) return null

  return createPortal(
    <div
      className="bg-picker-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-picker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bg-picker-title"
      >
        <div className="bg-picker__head">
          <h2 id="bg-picker-title" className="bg-picker__title">
            Choose background
          </h2>
          <button
            type="button"
            className="bg-picker__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-picker__body">
          <form
            className="bg-picker__search"
            onSubmit={(e) => {
              e.preventDefault()
              onSearch?.(searchValue)
            }}
          >
            <input
              type="text"
              className="bg-picker__search-input"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search backgrounds (mountains, city, ocean...)"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-picker__search-btn"
              aria-label="Search backgrounds"
              title="Search backgrounds"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </form>
          {loading ? (
            <div className="bg-picker__status bg-picker__status--loading">
              <Spinner size={32} />
              <p>Loading photos…</p>
            </div>
          ) : error ? (
            <p className="bg-picker__status bg-picker__status--error" role="alert">
              {error}
            </p>
          ) : photos.length === 0 ? (
            <p className="bg-picker__status">No photos found. Try another filter.</p>
          ) : (
            <ul className="bg-picker__grid">
              {photos.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="bg-picker__thumb"
                    onClick={() => onSelectPhoto(p)}
                    title="Use this image"
                  >
                    <img
                      className="bg-picker__thumb-img"
                      src={p.thumbUrl || p.fullUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget
                        if (el.dataset.fallback === '1' || !p.fullUrl) return
                        el.dataset.fallback = '1'
                        el.src = p.fullUrl
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-picker__footer">
          {onShuffleAnimated ? (
            <button
              type="button"
              className="bg-picker__animated-btn"
              onClick={() => {
                onShuffleAnimated()
                onClose()
              }}
            >
              New animated theme
            </button>
          ) : null}
          {onUseDefault ? (
            <button
              type="button"
              className="bg-picker__default-btn"
              onClick={() => {
                onUseDefault()
                onClose()
              }}
            >
              Original gradient
            </button>
          ) : null}
          <p className="bg-picker__credit">
            Photos from{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
