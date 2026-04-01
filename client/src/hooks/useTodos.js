import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchJSON } from '../api'

function todosForColumn(todos, columnId) {
  return todos
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function reorderList(items, fromIndex, toIndex) {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
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
      [...(data.columns ?? [])].sort(
        (a, b) =>
          (a.order ?? a.id) - (b.order ?? b.id) || a.id - b.id,
      ),
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

  async function handleBoardDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const did = String(draggableId)
    if (did.startsWith('col-')) {
      if (destination.droppableId !== 'board-columns') return
      const nextColumns = reorderList(columns, source.index, destination.index)
      const nextIds = nextColumns.map((c) => c.id)
      const previousColumns = columns

      setColumns(nextColumns)
      setActionError(null)
      try {
        await fetchJSON('/api/columns/reorder', {
          method: 'PUT',
          body: JSON.stringify({ ids: nextIds }),
        })
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not reorder columns.'
        setColumns(previousColumns)
        setActionError(message)
        console.error(e)
        await load()
      }
      return
    }

    const id = Number(draggableId)
    const toColumnId = parseColumnDroppableId(destination.droppableId)
    const toIndex = destination.index

    setActionError(null)
    try {
      await fetchJSON('/api/todos/move', {
        method: 'PUT',
        body: JSON.stringify({ id, toColumnId, toIndex }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not move task.'
      setActionError(message)
      console.error(e)
      await load()
    }
  }

  async function deleteColumn(columnId) {
    setActionError(null)
    try {
      await fetchJSON(`/api/columns/${columnId}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not delete column.'
      setActionError(message)
      console.error(e)
    }
  }

  function parseColumnDroppableId(droppableId) {
    const m = /^column-(\d+)$/.exec(String(droppableId))
    if (!m) throw new Error('Invalid column')
    return Number(m[1])
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
    handleBoardDragEnd,
    deleteColumn,
    columnStats,
  }
}

