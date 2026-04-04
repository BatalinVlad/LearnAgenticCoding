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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function applyOptimisticTodoMove(
  todos,
  { id, fromColumnId, toColumnId, toIndex },
) {
  const nextTodos = todos.map((todo) => ({ ...todo }))
  const sourceList = todosForColumn(nextTodos, fromColumnId)
  const sourceIndex = sourceList.findIndex((todo) => todo.id === id)
  if (sourceIndex === -1) return todos

  const [moved] = sourceList.splice(sourceIndex, 1)
  moved.columnId = toColumnId

  const targetList =
    fromColumnId === toColumnId
      ? sourceList
      : todosForColumn(nextTodos, toColumnId)

  const safeIndex = clamp(toIndex, 0, targetList.length)
  targetList.splice(safeIndex, 0, moved)

  sourceList.forEach((todo, index) => {
    todo.sortOrder = index
  })

  if (fromColumnId !== toColumnId) {
    targetList.forEach((todo, index) => {
      todo.sortOrder = index
    })
  }

  return nextTodos
}

export function checklistStats(checklist) {
  const list = Array.isArray(checklist) ? checklist : []
  const total = list.length
  const doneCount = list.filter((c) => c.done).length
  const percent =
    total === 0 ? 0 : Math.round((doneCount / total) * 100)
  return { total, doneCount, percent }
}

export function useTodos() {
  const [columns, setColumns] = useState([])
  const [todos, setTodos] = useState([])
  const [columnDrafts, setColumnDrafts] = useState({})
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  /** Photo upload validation/read errors; shown in card modal for `taskId`. */
  const [photoError, setPhotoError] = useState(null)
  const [photoLoadingId, setPhotoLoadingId] = useState(null)
  const [viewerPhoto, setViewerPhoto] = useState(null)
  const [menuTaskId, setMenuTaskId] = useState(null)

  const { total, doneCount, percent } = useMemo(() => {
    let total = 0
    let doneCount = 0
    for (const t of todos) {
      const ch = Array.isArray(t.checklist) ? t.checklist : []
      total += ch.length
      doneCount += ch.filter((c) => c.done).length
    }
    const percent =
      total === 0 ? 0 : Math.round((doneCount / total) * 100)
    return { total, doneCount, percent }
  }, [todos])

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
      if (!e.target.closest('[data-card-menu]')) {
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

  async function updateCardTitle(id, title) {
    const t = title.trim()
    if (!t) return
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: t }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not update card.'
      setActionError(message)
      console.error(e)
    }
  }

  async function updateCardDescription(id, description) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: String(description ?? '') }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not update description.'
      setActionError(message)
      console.error(e)
    }
  }

  async function updateCardLabel(id, label) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ label }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not update label.'
      setActionError(message)
      console.error(e)
    }
  }

  async function updateCardAssignee(id, assigneeId) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not update assignee.'
      setActionError(message)
      console.error(e)
    }
  }

  async function updateCardDueDate(id, dueDate) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ dueDate: dueDate === null ? null : dueDate }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not update due date.'
      setActionError(message)
      console.error(e)
    }
  }

  async function addChecklistItem(cardId, text) {
    const t = text.trim()
    if (!t) return
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${cardId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ text: t }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not add item.'
      setActionError(message)
      console.error(e)
    }
  }

  async function toggleChecklistItem(cardId, itemId, done) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${cardId}/checklist/${itemId}`, {
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

  async function updateChecklistItemText(cardId, itemId, text) {
    const t = text.trim()
    if (!t) return
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${cardId}/checklist/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: t }),
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not update item.'
      setActionError(message)
      console.error(e)
    }
  }

  async function removeChecklistItem(cardId, itemId) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${cardId}/checklist/${itemId}`, {
        method: 'DELETE',
      })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not remove item.'
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

  async function duplicateCard(id) {
    setActionError(null)
    try {
      await fetchJSON(`/api/todos/${id}/duplicate`, { method: 'POST' })
      await load()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not duplicate card.'
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

  const clearPhotoError = useCallback(() => {
    setPhotoError(null)
  }, [])

  async function handleTaskPhotoChange(id, e) {
    const file = e.target.files?.[0]
    if (!file) {
      e.target.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError({ taskId: id, message: 'Please choose an image file.' })
      e.target.value = ''
      return
    }
    if (file.size > 700 * 1024) {
      setPhotoError({
        taskId: id,
        message: 'Image is too large. Use up to 700KB.',
      })
      e.target.value = ''
      return
    }
    
    setPhotoLoadingId(id)
    let dataUrl
    try {
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    } catch (e2) {
      setPhotoError({ taskId: id, message: 'Could not read image file.' })
      console.error(e2)
      e.target.value = ''
      setPhotoLoadingId(null)
      return
    }

    setPhotoError(null)
    try {
      await updateTaskPhoto(id, dataUrl)
      e.target.value = ''
    } catch (e3) {
      const message =
        e3 instanceof Error
          ? e3.message
          : 'Could not save photo. Try again.'
      setPhotoError({ taskId: id, message })
      console.error(e3)
      e.target.value = ''
    }
    setPhotoLoadingId(null)
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
    const fromColumnId = parseColumnDroppableId(source.droppableId)
    const toColumnId = parseColumnDroppableId(destination.droppableId)
    const toIndex = destination.index

    const previousTodos = todos
    const optimisticTodos = applyOptimisticTodoMove(todos, {
      id,
      fromColumnId,
      toColumnId,
      toIndex,
    })

    setTodos(optimisticTodos)
    setActionError(null)
    try {
      await fetchJSON('/api/todos/move', {
        method: 'PUT',
        body: JSON.stringify({ id, toColumnId, toIndex }),
      })
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not move task.'
      setTodos(previousTodos)
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

  return {
    columns,
    todos,
    columnDrafts,
    setColumnDraft: setDraft,
    loadError,
    actionError,
    photoError,
    photoLoadingId,
    clearPhotoError,
    viewerPhoto,
    setViewerPhoto,
    menuTaskId,
    setMenuTaskId,
    total,
    doneCount,
    percent,
    todosForColumn: (columnId) => todosForColumn(todos, columnId),
    handleSubmit,
    addColumn,
    updateColumnTitle,
    updateCardTitle,
    updateCardDescription,
    updateCardLabel,
    updateCardAssignee,
    updateCardDueDate,
    addChecklistItem,
    toggleChecklistItem,
    updateChecklistItemText,
    removeChecklistItem,
    remove,
    duplicateCard,
    updateTaskPhoto,
    handleTaskPhotoChange,
    handleBoardDragEnd,
    deleteColumn,
  }
}

