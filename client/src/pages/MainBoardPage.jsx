import { useState } from 'react'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import TaskBackground from '../TaskBackground'
import { useTodos } from '../hooks/useTodos'
import { ConfettiCelebration } from '../components/ConfettiCelebration/ConfettiCelebration'
import { MainBoard } from '../components/MainBoard/MainBoard'
import { Column } from '../components/Column/Column'
import { TodoList } from '../components/TodoList/TodoList'
import { ProgressFooter } from '../components/ProgressFooter/ProgressFooter'
import { PhotoViewer } from '../components/PhotoViewer/PhotoViewer'
import { ConfirmationModal } from '../components/ConfirmationModal/ConfirmationModal'

export default function MainBoardPage() {
  const [columnToDelete, setColumnToDelete] = useState(null)

  const {
    columns,
    columnDrafts,
    setColumnDraft,
    loadError,
    actionError,
    viewerPhoto,
    setViewerPhoto,
    menuTaskId,
    setMenuTaskId,
    allComplete,
    todosForColumn,
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
  } = useTodos()

  return (
    <>
      <TaskBackground />
      <main className="app">
        {allComplete ? <ConfettiCelebration /> : null}

        <MainBoard title="MAIN BOARD">
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
                    const list = todosForColumn(col.id)
                    const { total, doneCount, percent } = columnStats(col.id)
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
                              onTitleChange={(v) => updateColumnTitle(col.id, v)}
                              canDelete={columns.length > 1}
                              onDeleteColumn={() => setColumnToDelete(col.id)}
                              columnDragHandleProps={dragProvided.dragHandleProps}
                              isColumnDragging={dragSnapshot.isDragging}
                            >
                              <form
                                className="add"
                                onSubmit={handleSubmit(col.id)}
                              >
                                <input
                                  id={
                                    colIndex === 0 ? 'new-todo-input' : undefined
                                  }
                                  name={`new-todo-${col.id}`}
                                  type="text"
                                  value={columnDrafts[col.id] ?? ''}
                                  onChange={(e) =>
                                    setColumnDraft(col.id, e.target.value)
                                  }
                                  placeholder="Enter a title for this card..."
                                  autoComplete="off"
                                  autoCorrect="off"
                                  spellCheck={false}
                                  data-lpignore="true"
                                  autoFocus={colIndex === 0}
                                />
                                <button type="submit" className="btn-add">
                                  Add
                                </button>
                              </form>
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
                                    menuTaskId={menuTaskId}
                                    setMenuTaskId={setMenuTaskId}
                                    onToggleDone={toggleDone}
                                    onViewPhoto={setViewerPhoto}
                                    onPhotoChange={handleTaskPhotoChange}
                                    onRemovePhoto={updateTaskPhoto}
                                    onDelete={remove}
                                  />
                                )}
                              </div>

                              {!loadError ? (
                                <ProgressFooter
                                  percent={percent}
                                  labelRight={
                                    total === 0
                                      ? 'No tasks yet'
                                      : `${doneCount} of ${total} completed`
                                  }
                                />
                              ) : null}
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

      <PhotoViewer src={viewerPhoto} onClose={() => setViewerPhoto(null)} />
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
    </>
  )
}
