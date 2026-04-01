import TaskBackground from '../TaskBackground'
import { useTodos } from '../hooks/useTodos'
import { ConfettiCelebration } from '../components/ConfettiCelebration/ConfettiCelebration'
import { MainBoard } from '../components/MainBoard/MainBoard'
import { Column } from '../components/Column/Column'
import { TodoList } from '../components/TodoList/TodoList'
import { ProgressFooter } from '../components/ProgressFooter/ProgressFooter'
import { PhotoViewer } from '../components/PhotoViewer/PhotoViewer'

export default function MainBoardPage() {
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
    handleDragEnd,
    columnStats,
  } = useTodos()

  return (
    <>
      <TaskBackground />
      <main className="app">
        {allComplete ? <ConfettiCelebration /> : null}

        <MainBoard title="MAIN BOARD">
          {columns.map((col, colIndex) => {
            const list = todosForColumn(col.id)
            const { total, doneCount, percent } = columnStats(col.id)

            return (
              <Column
                key={col.id}
                title={col.title}
                onTitleChange={(v) => updateColumnTitle(col.id, v)}
              >
                <form className="add" onSubmit={handleSubmit(col.id)}>
                  <input
                    id={colIndex === 0 ? 'new-todo-input' : undefined}
                    name={`new-todo-${col.id}`}
                    type="text"
                    value={columnDrafts[col.id] ?? ''}
                    onChange={(e) => setColumnDraft(col.id, e.target.value)}
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
                      Could not load tasks. Is the API server running?
                    </p>
                  ) : list.length === 0 ? (
                    <p className="empty">Nothing here yet. Add a task above.</p>
                  ) : (
                    <TodoList
                      columnId={col.id}
                      todos={list}
                      menuTaskId={menuTaskId}
                      setMenuTaskId={setMenuTaskId}
                      onDragEnd={handleDragEnd(col.id)}
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
            )
          })}

          <button
            type="button"
            className="add-column-btn"
            onClick={addColumn}
          >
            + Add Another Column
          </button>
        </MainBoard>
      </main>

      <PhotoViewer src={viewerPhoto} onClose={() => setViewerPhoto(null)} />
    </>
  )
}
