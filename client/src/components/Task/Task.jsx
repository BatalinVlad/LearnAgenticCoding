import { createPortal } from 'react-dom'

export function Task({
  innerRef,
  draggableProps,
  dragHandleProps,
  item,
  isDragging,
  menuOpen,
  onToggleMenu,
  onToggleDone,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  onDelete,
}) {
  const itemNode = (
    <li
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      className={
        'item' +
        (item.done ? ' done' : '') +
        (isDragging ? ' dragging' : '')
      }
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={(e) => onToggleDone(item.id, e.target.checked)}
        aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
      />
      <span className="label">{item.text}</span>
      <div className="item-actions" data-task-actions>
        <button
          type="button"
          className="item-menu-btn"
          onClick={onToggleMenu}
          aria-label="Task actions"
        >
          &#8230;
        </button>
        {menuOpen ? (
          <div className="item-menu">
            {item.photo ? (
              <button
                type="button"
                className="item-menu-option"
                onClick={() => onViewPhoto(item.photo)}
              >
                View Photo
              </button>
            ) : null}
            <label className="item-menu-option item-menu-file">
              {item.photo ? 'Change Photo' : 'Add Photo'}
              <input
                type="file"
                accept="image/*"
                className="photo-input"
                onChange={(e) => onPhotoChange(item.id, e)}
              />
            </label>
            {item.photo ? (
              <button
                type="button"
                className="item-menu-option"
                onClick={() => onRemovePhoto(item.id)}
              >
                Remove Photo
              </button>
            ) : null}
            <button
              type="button"
              className="item-menu-option item-menu-option--danger"
              onClick={() => onDelete(item.id)}
            >
              Delete Task
            </button>
          </div>
        ) : null}
      </div>
    </li>
  )

  return isDragging ? createPortal(itemNode, document.body) : itemNode
}
