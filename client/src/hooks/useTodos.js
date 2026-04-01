import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchJSON } from '../api'

function todosForColumn(todos, columnId) {
  return todos
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function useTodos() {
  const [columns, setColumns] = useState([])
  const [todos, setTodos] = useState([])
  const [columnDrafts, setColumnDrafts] = useState({})
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [viewerPhoto, setViewerPhoto] = useState(null)
  const [menuTaskId, setMenuTaskId] = useState(null)

  const { total, doneCount, percent } = useMemo(() => {
    const total = todos.length
    const doneCount = todos.filter((t) => t.done).length
    const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100)
    return { total, doneCount, percent }
  }, [todos])

  const allComplete = total > 0 && doneCount === total

  const load = useCallback(async () => {
    const data = await fetchJSON('/api/board')
    setColumns(
      [...(data.columns ?? [])].sort((a, b) => a.id - b.id),
    )
    setTodos(data.todos ?? [])
    setColumnDrafts((prev) => {
      const next = { ...prev }
      for (const c of data.columns ?? []) {
        if (next[c.id] === undefined) next[c.id] = ''
      }
      return next
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await load()
        if (!cancelled) setLoadError(null)
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : 'Could not load tasks.',
          )
          setActionError(null)
          console.error(e)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    function handleOutsidePointer(e) {
      if (!e.target.closest('[data-task-actions]')) {
        setMenuTaskId(null)
      }
    }
    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer)
    }
  }, [])

  function setDraft(columnId, text) {
    setColumnDrafts((prev) => ({ ...prev, [columnId]: text }))
  }

  async function addColumn() {
    setActionError(null)
    try {
      await fetchJSON('/api/columns', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not add column.'
      setActionError(message)
      console.error(e)
    }
  }

  async function updateColumnTitle(columnId, title) {
    const t = title.trim()
    if (!t) return
    setActionError(null)
    try {
      await fetchJSON(`/api/columns/${columnId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: t }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not update column title.'
      setActionError(message)
      console.error(e)
    }
  }

  function handleSubmit(columnId) {
    return async function (e) {
      e.preventDefault()
      const t = (columnDrafts[columnId] ?? '').trim()
      if (!t) return
      setActionError(null)
      try {
        await fetchJSON('/api/todos', {
          method: 'POST',
          body: JSON.stringify({ text: t, columnId }),
        })
        setDraft(columnId, '')
        await load()
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Something went wrong. Try again.'
        setActionError(message)
        console.error(e)
      }
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

  async function reorder(columnId, fromId, targetIndex) {
    const columnTodos = todosForColumn(todos, columnId)
    const fromIndex = columnTodos.findIndex((t) => t.id === fromId)
    if (fromIndex === -1) return

    const next = [...columnTodos]
    const [moved] = next.splice(fromIndex, 1)
    const safeTarget = Math.max(0, Math.min(targetIndex, next.length))
    next.splice(safeTarget, 0, moved)
    if (safeTarget === fromIndex) return

    setTodos((prev) => {
      const others = prev.filter((t) => t.columnId !== columnId)
      const reindexed = next.map((t, i) => ({ ...t, sortOrder: i }))
      return [...others, ...reindexed]
    })

    setActionError(null)
    try {
      await fetchJSON('/api/todos/reorder', {
        method: 'PUT',
        body: JSON.stringify({
          columnId,
          ids: next.map((t) => t.id),
        }),
      })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not reorder tasks.'
      setActionError(message)
      console.error(e)
      await load()
    }
  }

  function handleDragEnd(columnId) {
    return async function (result) {
      const { source, destination, draggableId } = result
      if (!destination) return
      if (source.index === destination.index) return
      await reorder(columnId, Number(draggableId), destination.index)
    }
  }

  function columnStats(columnId) {
    const list = todosForColumn(todos, columnId)
    const total = list.length
    const doneCount = list.filter((t) => t.done).length
    const percent =
      total === 0 ? 0 : Math.round((doneCount / total) * 100)
    return { total, doneCount, percent }
  }

  return {
    columns,
    todos,
    columnDrafts,
    setColumnDraft: setDraft,
    loadError,
    actionError,
    viewerPhoto,
    setViewerPhoto,
    menuTaskId,
    setMenuTaskId,
    total,
    doneCount,
    percent,
    allComplete,
    todosForColumn: (columnId) => todosForColumn(todos, columnId),
    handleSubmit,
    addColumn,
    updateColumnTitle,
    toggleDone,
    remove,
    updateTaskPhoto,
    handleTaskPhotoChange,
    handleDragEnd,
    columnStats,
  }
}
