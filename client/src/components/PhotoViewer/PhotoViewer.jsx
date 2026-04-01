export function PhotoViewer({ src, onClose }) {
  if (!src) return null

  return (
    <div className="photo-viewer" onClick={onClose}>
      <div
        className="photo-viewer__card"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={src} alt="Task preview" className="photo-viewer__img" />
        <button type="button" className="photo-viewer__close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
