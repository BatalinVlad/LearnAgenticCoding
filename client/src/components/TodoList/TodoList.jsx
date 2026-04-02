import { Draggable, Droppable } from '@hello-pangea/dnd'
import { Task } from '../Task/Task.jsx'

export function TodoList({
  droppableId,
  todos,
  menuTaskId,
  setMenuTaskId,
  onToggleDone,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  onDelete,
}) {
  return (
    <>
      {todos.length === 0 ? (
        <p className="empty empty--in-column">Nothing here yet. Add a task above.</p>
      ) : null}
      <Droppable droppableId={droppableId}>
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
                {(dragProvided, dragSnapshot) => (
                  <Task
                    innerRef={dragProvided.innerRef}
                    draggableProps={dragProvided.draggableProps}
                    dragHandleProps={dragProvided.dragHandleProps}
                    item={item}
                    isDragging={dragSnapshot.isDragging}
                    menuOpen={menuTaskId === item.id}
                    onToggleMenu={() =>
                      setMenuTaskId((prev) =>
                        prev === item.id ? null : item.id,
                      )
                    }
                    onToggleDone={onToggleDone}
                    onViewPhoto={(photo) => {
                      onViewPhoto(photo)
                      setMenuTaskId(null)
                    }}
                    onPhotoChange={(id, e) => {
                      onPhotoChange(id, e)
                      setMenuTaskId(null)
                    }}
                    onRemovePhoto={(id) => {
                      onRemovePhoto(id)
                      setMenuTaskId(null)
                    }}
                    onDelete={(id) => {
                      onDelete(id)
                      setMenuTaskId(null)
                    }}
                  />
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}
          </ul>
        )}
      </Droppable>
    </>
  )
}
