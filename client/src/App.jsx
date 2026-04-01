import { useCallback, useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { createPortal } from 'react-dom'
import { fetchJSON } from './api'
import TaskBackground from './TaskBackground'
import './App.css'

export default function App() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [viewerPhoto, setViewerPhoto] = useState(null)

  const { total, doneCount, percent } = useMemo(() => {
    const total = todos.length
    const doneCount = todos.filter((t) => t.done).length
    const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100)
    return { total, doneCount, percent }
  }, [todos])
  const allComplete = total > 0 && doneCount === total

  const load = useCallback(async () => {
    const list = await fetchJSON('/api/todos')
    setTodos(list)
  }, [])

  useEffect(() => {
    load()
      .then(() => setLoadError(null))
      .catch((e) => {
        setLoadError(
          e instanceof Error ? e.message : 'Could not load tasks.',
        )
        setActionError(null)
        console.error(e)
      })
  }, [load])

  async function handleSubmit(e) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setActionError(null)
    try {
      await fetchJSON('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ text: t }),
      })
      setText('')
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Something went wrong. Try again.'
      setActionError(message)
      console.error(e)
    }
  }

  async function toggleDone(id, done) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ done }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Something went wrong. Try again.'
      setActionError(message)
      console.error(e)
    }
  }

  async function remove(id) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Something went wrong. Try again.'
      setActionError(message)
      console.error(e)
    }
  }

  async function updateTaskPhoto(id, nextPhoto) {
    await fetchJSON(`/api/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ photo: nextPhoto }),
    })
    await load()
  }

  async function handleTaskPhotoChange(id, e) {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      setActionError('Please choose an image file.')
      e.target.value = ''
      return
    }
    if (file.size > 700 * 1024) {
      setActionError('Image is too large. Use up to 700KB.')
      e.target.value = ''
      return
    }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setActionError(null)
      await updateTaskPhoto(id, dataUrl)
      e.target.value = ''
    } catch (e2) {
      setActionError('Could not read image file.')
      console.error(e2)
      e.target.value = ''
    }
  }

  async function reorder(fromId, targetIndex) {
    const fromIndex = todos.findIndex((t) => t.id === fromId)
    if (fromIndex === -1) return

    const next = [...todos]
    const [moved] = next.splice(fromIndex, 1)
    const safeTarget = Math.max(0, Math.min(targetIndex, next.length))
    next.splice(safeTarget, 0, moved)
    if (safeTarget === fromIndex) return
    setTodos(next)

    setActionError(null)
    try {
      await fetchJSON('/api/todos/reorder', {
        method: 'PUT',
        body: JSON.stringify({ ids: next.map((t) => t.id) }),
      })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not reorder tasks.'
      setActionError(message)
      console.error(e)
      await load()
    }
  }

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.index === destination.index) return
    await reorder(Number(draggableId), destination.index)
  }

  return (
    <>
      <TaskBackground />
      <main className="app">
      {allComplete ? (
        <div className="celebrate" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="confetti" />
          ))}
        </div>
      ) : null}
      <header className="app-header">
        <h1 className="title" translate="no">
          TO DO
        </h1>
      </header>

      <form className="add" onSubmit={handleSubmit}>
        <input
          id="new-todo-input"
          name="new-todo-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs doing?"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-lpignore="true"
          autoFocus
        />
        <button type="submit" className="btn-add">
          Add
        </button>
      </form>
      {actionError ? (
        <p className="action-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="list-scroll">
        {loadError ? (
          <p className="empty">Could not load tasks. Is the API server running?</p>
        ) : todos.length === 0 ? (
          <p className="empty">Nothing here yet. Add a task above.</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="todo-list">
              {(dropProvided, dropSnapshot) => (
                <ul
                  className={
                    'list' + (dropSnapshot.isDraggingOver ? ' list-over' : '')
                  }
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                >
                  {todos.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={String(item.id)}
                      index={index}
                    >
                      {(dragProvided, dragSnapshot) => {
                        const itemNode = (
                          <li
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={
                              'item' +
                              (item.done ? ' done' : '') +
                              (dragSnapshot.isDragging ? ' dragging' : '')
                            }
                            style={dragProvided.draggableProps.style}
                          >
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={(e) => toggleDone(item.id, e.target.checked)}
                              aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
                            />
                            <span className="label">{item.text}</span>
                            {item.photo ? (
                              <button
                                type="button"
                                className="task-photo-btn"
                                onClick={() => setViewerPhoto(item.photo)}
                                aria-label="Open task photo"
                              >
                                <img src={item.photo} alt="" className="task-photo" />
                              </button>
                            ) : null}
                            <label className="task-photo-add">
                              {item.photo ? 'Change' : 'Photo'}
                              <input
                                type="file"
                                accept="image/*"
                                className="photo-input"
                                onChange={(e) => handleTaskPhotoChange(item.id, e)}
                              />
                            </label>
                            {item.photo ? (
                              <button
                                type="button"
                                className="btn-clear-photo"
                                onClick={() => updateTaskPhoto(item.id, null)}
                              >
                                Clear
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => remove(item.id)}
                            >
                              Remove
                            </button>
                          </li>
                        )

                        return dragSnapshot.isDragging
                          ? createPortal(itemNode, document.body)
                          : itemNode
                      }}
                    </Draggable>
                  ))}
                  {dropProvided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {!loadError ? (
        <footer className="progress-footer" aria-label="Completion progress">
          <div className="progress-label">
            <span className="progress-percent">{percent}%</span>
            <span className="progress-meta">
              {total === 0
                ? 'No tasks yet'
                : `${doneCount} of ${total} completed`}
            </span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div
              className="progress-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
        </footer>
      ) : null}
    </main>
    {viewerPhoto ? (
      <div className="photo-viewer" onClick={() => setViewerPhoto(null)}>
        <div
          className="photo-viewer__card"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={viewerPhoto} alt="Task preview" className="photo-viewer__img" />
          <button
            type="button"
            className="photo-viewer__close"
            onClick={() => setViewerPhoto(null)}
          >
            Close
          </button>
        </div>
      </div>
    ) : null}
    </>
  )
}
