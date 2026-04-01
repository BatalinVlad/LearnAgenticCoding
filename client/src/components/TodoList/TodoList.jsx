import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { Task } from '../Task/Task.jsx'

export function TodoList({
  columnId,
  todos,
  menuTaskId,
  setMenuTaskId,
  onDragEnd,
  onToggleDone,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  onDelete,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`todo-list-${columnId}`}>
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
    </DragDropContext>
  )
}
