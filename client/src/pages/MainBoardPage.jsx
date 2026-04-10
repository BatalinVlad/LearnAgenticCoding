import { useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import TaskBackground from '../components/TaskBackground/TaskBackground'
import { BackgroundPickerModal } from '../components/BackgroundPickerModal/BackgroundPickerModal'
import { fetchJSON } from '../api'
import { useTodos } from '../hooks/useTodos'
import { MainBoard } from '../components/MainBoard/MainBoard'
import { Column } from '../components/Column/Column'
import { TodoList } from '../components/TodoList/TodoList'
import { PhotoViewer } from '../components/PhotoViewer/PhotoViewer'
import { ConfirmationModal } from '../components/ConfirmationModal/ConfirmationModal'
import { CardModal } from '../components/CardModal/CardModal'
import { BoardHistoryModal } from '../components/BoardHistoryModal/BoardHistoryModal'
import { BoardChatModal } from '../components/BoardChatModal/BoardChatModal'
import { inputAutofillIgnoreProps } from '../utils/inputAutofillIgnoreProps'
import { generateAnimatedBackgroundTheme } from '../utils/generateAnimatedBackgroundTheme'

function filterTodosByCardText(todos, query) {
  const q = query.trim().toLowerCase()
  if (!q) return todos
  return todos.filter((t) => (t.text || '').toLowerCase().includes(q))
}

/** @param {string} assigneeFilter '' | 'unassigned' | member id string */
function filterTodosByAssignee(todos, assigneeFilter) {
  if (!assigneeFilter) return todos
  if (assigneeFilter === 'unassigned') {
    return todos.filter((t) => {
      const id = t.assigneeId
      return id == null || id === '' || !Number.isFinite(Number(id))
    })
  }
  const wantId = Number(assigneeFilter)
  if (!Number.isFinite(wantId)) return todos
  return todos.filter((t) => Number(t.assigneeId) === wantId)
}

function filterTodosForBoard(todos, textQuery, assigneeFilter) {
  let list = filterTodosByCardText(todos, textQuery)
  list = filterTodosByAssignee(list, assigneeFilter)
  return list
}

const BOARD_BG_STORAGE_KEY = 'mainboard-background-v2'
const BOARD_BG_LEGACY_KEY = 'mainboard-background-url'
const DEFAULT_COMPANY_BG = {
  url: 'https://images.unsplash.com/photo-1716703373229-b0e43de7dd5c?ixlib=rb-4.1.0&auto=format&fit=crop&w=1920&q=80',
  credit: {
    name: 'Musemind UX Agency',
    url: 'https://unsplash.com/photos/a-large-open-office-space-with-many-desks-and-chairs-Mgm6aq1UYpI',
  },
}

function isValidAnimatedTheme(t) {
  return (
    t &&
    typeof t === 'object' &&
    typeof t.base === 'string' &&
    typeof t.bloom === 'string' &&
    typeof t.orbA === 'string' &&
    typeof t.orbB === 'string' &&
    typeof t.orbC === 'string' &&
    typeof t.spark === 'string' &&
    typeof t.sparkGlow === 'string' &&
    typeof t.floatGlow === 'string'
  )
}

function readStoredBackground() {
  try {
    const raw = localStorage.getItem(BOARD_BG_STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && typeof p.url === 'string' && p.url.length > 0) {
        return {
          url: p.url,
          credit:
            p.credit && typeof p.credit.name === 'string'
              ? {
                  name: p.credit.name,
                  url: typeof p.credit.url === 'string' ? p.credit.url : '',
                }
              : null,
          animatedTheme: null,
        }
      }
      if (p && isValidAnimatedTheme(p.animatedTheme)) {
        return {
          url: null,
          credit: null,
          animatedTheme: p.animatedTheme,
        }
      }
    }
    const legacy = localStorage.getItem(BOARD_BG_LEGACY_KEY)
    if (legacy) {
      return { url: legacy, credit: null, animatedTheme: null }
    }
  } catch {
    /* ignore */
  }
  return {
    url: DEFAULT_COMPANY_BG.url,
    credit: DEFAULT_COMPANY_BG.credit,
    animatedTheme: null,
  }
}

export default function MainBoardPage() {
  const [columnToDelete, setColumnToDelete] = useState(null)
  const [openCardId, setOpenCardId] = useState(null)
  const [boardTitle, setBoardTitle] = useState('QUALITY CONTROL WORKFLOW')
  const [cardFilter, setCardFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [backgroundUrl, setBackgroundUrl] = useState(
    () => readStoredBackground().url,
  )
  const [backgroundCredit, setBackgroundCredit] = useState(
    () => readStoredBackground().credit,
  )
  const [animatedTheme, setAnimatedTheme] = useState(
    () => readStoredBackground().animatedTheme,
  )
  const [bgPickerOpen, setBgPickerOpen] = useState(false)
  const [boardHistoryOpen, setBoardHistoryOpen] = useState(false)
  const [boardChatOpen, setBoardChatOpen] = useState(false)
  const [bgPhotos, setBgPhotos] = useState([])
  const [bgLoading, setBgLoading] = useState(false)
  const [bgError, setBgError] = useState(null)
  const [bgSearchQuery, setBgSearchQuery] = useState('')

  useEffect(() => {
    try {
      if (backgroundUrl) {
        localStorage.setItem(
          BOARD_BG_STORAGE_KEY,
          JSON.stringify({
            url: backgroundUrl,
            credit: backgroundCredit,
            animatedTheme: null,
          }),
        )
        localStorage.removeItem(BOARD_BG_LEGACY_KEY)
      } else if (isValidAnimatedTheme(animatedTheme)) {
        localStorage.setItem(
          BOARD_BG_STORAGE_KEY,
          JSON.stringify({
            url: null,
            credit: null,
            animatedTheme,
          }),
        )
        localStorage.removeItem(BOARD_BG_LEGACY_KEY)
      } else {
        localStorage.removeItem(BOARD_BG_STORAGE_KEY)
        localStorage.removeItem(BOARD_BG_LEGACY_KEY)
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [backgroundUrl, backgroundCredit, animatedTheme])

  async function loadBackgroundPhotos(query = '') {
    const q = String(query || '').trim()
    setBgError(null)
    setBgLoading(true)
    setBgPhotos([])
    try {
      const endpoint = q
        ? `/api/unsplash/photos?query=${encodeURIComponent(q)}`
        : '/api/unsplash/photos'
      const data = await fetchJSON(endpoint)
      setBgPhotos(Array.isArray(data.photos) ? data.photos : [])
    } catch (e) {
      setBgError(
        e instanceof Error ? e.message : 'Could not load photos. Try again.',
      )
    } finally {
      setBgLoading(false)
    }
  }

  async function openBackgroundPicker() {
    setBgPickerOpen(true)
    const defaultSearch = 'open space office'
    setBgSearchQuery(defaultSearch)
    await loadBackgroundPhotos(defaultSearch)
  }

  const {
    todos,
    columns,
    columnDrafts,
    setColumnDraft,
    loadError,
    actionError,
    photoError,
    photoLoadingId,
    clearPhotoError,
    viewerPhoto,
    setViewerPhoto,
    menuTaskId,
    setMenuTaskId,
    todosForColumn,
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
  } = useTodos()

  const openCard = useMemo(
    () => (openCardId == null ? null : todos.find((t) => t.id === openCardId) ?? null),
    [openCardId, todos],
  )

  useEffect(() => {
    if (openCardId != null && !todos.some((t) => t.id === openCardId)) {
      setOpenCardId(null)
    }
  }, [openCardId, todos])

  useEffect(() => {
    if (photoError) setOpenCardId(photoError.taskId)
  }, [photoError])

  return (
    <>
      <TaskBackground
        backgroundUrl={backgroundUrl}
        animatedTheme={backgroundUrl ? null : animatedTheme}
      />
      {backgroundUrl && backgroundCredit ? (
        <div className="unsplash-attribution">
          Photo by{' '}
          <a
            href={backgroundCredit.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {backgroundCredit.name}
          </a>
          {' on '}
          <a
            href="https://unsplash.com/?utm_source=learnagentic&utm_medium=referral"
            target="_blank"
            rel="noreferrer noopener"
          >
            Unsplash
          </a>
        </div>
      ) : null}
      <main className="app">

        <MainBoard
          title={boardTitle}
          onTitleChange={setBoardTitle}
          cardFilter={cardFilter}
          onCardFilterChange={setCardFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          onOpenBackgroundPicker={openBackgroundPicker}
          onOpenBoardHistory={() => setBoardHistoryOpen(true)}
          onOpenBoardChat={() => setBoardChatOpen(true)}
        >
          <DragDropContext onDragEnd={handleBoardDragEnd}>
            <div className="main-board__row">
            <Droppable
              droppableId="board-columns"
              direction="horizontal"
              type="BOARD"
            >
              {(boardProvided) => (
                <div
                  className="main-board__columns"
                  ref={boardProvided.innerRef}
                  {...boardProvided.droppableProps}
                >
                  {columns.map((col, colIndex) => {
                    const fullList = todosForColumn(col.id)
                    const list = filterTodosForBoard(
                      fullList,
                      cardFilter,
                      assigneeFilter,
                    )
                    const droppableId = `column-${col.id}`

                    return (
                      <Draggable
                        key={col.id}
                        draggableId={`col-${col.id}`}
                        index={colIndex}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            className={
                              'board-column-wrap' +
                              (dragSnapshot.isDragging
                                ? ' board-column-wrap--dragging'
                                : '')
                            }
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                          >
                            <Column
                              title={col.title}
                              titleInputId={`column-title-input-${col.id}`}
                              onTitleChange={(v) => updateColumnTitle(col.id, v)}
                              canDelete={columns.length > 1}
                              onDeleteColumn={() => setColumnToDelete(col.id)}
                              columnDragHandleProps={dragProvided.dragHandleProps}
                              isColumnDragging={dragSnapshot.isDragging}
                            >
                              {actionError && colIndex === 0 ? (
                                <p className="action-error" role="alert">
                                  {actionError}
                                </p>
                              ) : null}

                              <div className="list-scroll">
                                {loadError ? (
                                  <p className="empty">
                                    Could not load tasks. Is the API server
                                    running?
                                  </p>
                                ) : (
                                  <TodoList
                                    droppableId={droppableId}
                                    todos={list}
                                    unfilteredCount={fullList.length}
                                    isDragDisabled={
                                      cardFilter.trim().length > 0 ||
                                      assigneeFilter.length > 0
                                    }
                                    menuTaskId={menuTaskId}
                                    setMenuTaskId={setMenuTaskId}
                                    photoLoadingId={photoLoadingId}
                                    onOpenCard={(card) => {
                                      if (
                                        photoError &&
                                        photoError.taskId !== card.id
                                      ) {
                                        clearPhotoError()
                                      }
                                      setOpenCardId(card.id)
                                    }}
                                    onViewPhoto={setViewerPhoto}
                                    onPhotoChange={handleTaskPhotoChange}
                                    onRemovePhoto={(id) =>
                                      updateTaskPhoto(id, null)
                                    }
                                    onDuplicate={(id) => {
                                      duplicateCard(id)
                                      setMenuTaskId(null)
                                    }}
                                    onUpdateCardLabel={updateCardLabel}
                                    onUpdateCardAssignee={updateCardAssignee}
                                    onDelete={remove}
                                  />
                                )}
                              </div>

                              <form
                                className="add"
                                autoComplete="off"
                                data-bwignore="true"
                                onSubmit={handleSubmit(col.id)}
                              >
                                <input
                                  id={`new-card-input-${col.id}`}
                                  name={`new-card-${col.id}`}
                                  type="text"
                                  value={columnDrafts[col.id] ?? ''}
                                  onChange={(e) =>
                                    setColumnDraft(col.id, e.target.value)
                                  }
                                  placeholder="Enter a title for this card..."
                                  autoCorrect="off"
                                  spellCheck={false}
                                  autoFocus={colIndex === 0}
                                  {...inputAutofillIgnoreProps}
                                />
                                <button type="submit" className="btn-add">
                                  Add card
                                </button>
                              </form>
                            </Column>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {boardProvided.placeholder}
                  <button
                    type="button"
                    className="add-column-btn"
                    onClick={addColumn}
                  >
                    + Add Another Column
                  </button>
                </div>
              )}
            </Droppable>
            </div>
          </DragDropContext>
        </MainBoard>
      </main>

      <BoardHistoryModal
        open={boardHistoryOpen}
        onClose={() => setBoardHistoryOpen(false)}
        columns={columns}
        todos={todos}
      />

      <BoardChatModal
        open={boardChatOpen}
        onClose={() => setBoardChatOpen(false)}
      />

      <BackgroundPickerModal
        open={bgPickerOpen}
        onClose={() => setBgPickerOpen(false)}
        photos={bgPhotos}
        loading={bgLoading}
        error={bgError}
        searchQuery={bgSearchQuery}
        onSearch={async (query) => {
          setBgSearchQuery(query.trim())
          await loadBackgroundPhotos(query)
        }}
        onSelectPhoto={(photo) => {
          setAnimatedTheme(null)
          setBackgroundUrl(photo.fullUrl)
          setBackgroundCredit({
            name: photo.photographerName,
            url: photo.photoPageUrl || photo.photographerUrl,
          })
          setBgPickerOpen(false)
        }}
        onUseDefault={() => {
          setBackgroundUrl(null)
          setBackgroundCredit(null)
          setAnimatedTheme(null)
        }}
        onShuffleAnimated={() => {
          setBackgroundUrl(null)
          setBackgroundCredit(null)
          setAnimatedTheme(generateAnimatedBackgroundTheme())
        }}
      />

      {openCard ? (
        <CardModal
          card={openCard}
          photoError={
            photoError && photoError.taskId === openCard.id
              ? photoError.message
              : null
          }
          isPhotoLoading={photoLoadingId === openCard.id}
          onClose={() => {
            clearPhotoError()
            setOpenCardId(null)
          }}
          onUpdateTitle={updateCardTitle}
          onUpdateDescription={updateCardDescription}
          onUpdateCardLabel={updateCardLabel}
          onUpdateCardAssignee={updateCardAssignee}
          onUpdateDueDate={updateCardDueDate}
          onAddChecklistItem={addChecklistItem}
          onToggleChecklistItem={toggleChecklistItem}
          onUpdateChecklistItemText={updateChecklistItemText}
          onRemoveChecklistItem={removeChecklistItem}
          onDeleteCard={remove}
          onViewPhoto={setViewerPhoto}
          onPhotoChange={handleTaskPhotoChange}
          onRemovePhoto={(id) => updateTaskPhoto(id, null)}
        />
      ) : null}

      {columnToDelete && (
        <ConfirmationModal
          title="Delete Column"
          message="Are you sure you want to delete this column? Its tasks will move to another column."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => {
            deleteColumn(columnToDelete)
            setColumnToDelete(null)
          }}
          onCancel={() => setColumnToDelete(null)}
        />
      )}

      <PhotoViewer src={viewerPhoto} onClose={() => setViewerPhoto(null)} />
    </>
  )
}
