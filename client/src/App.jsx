import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchJSON } from './api'
import TaskBackground from './TaskBackground'
import './App.css'

export default function App() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)

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
          <ul className="list">
            {todos.map((item) => (
              <li
                key={item.id}
                className={'item' + (item.done ? ' done' : '')}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) => toggleDone(item.id, e.target.checked)}
                  aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
                />
                <span className="label">{item.text}</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => remove(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
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
    </>
  )
}
