import { Draggable, Droppable } from '@hello-pangea/dnd'
import { Card } from '../Card/Card.jsx'

export function TodoList({
  droppableId,
  todos,
  unfilteredCount,
  isDragDisabled,
  menuTaskId,
  setMenuTaskId,
  photoLoadingId,
  onOpenCard,
  onViewPhoto,
  onPhotoChange,
  onRemovePhoto,
  onDuplicate,
  onUpdateCardLabel,
  onDelete,
}) {
  return (
    <>
      {todos.length === 0 ? (
        <p className="empty empty--in-column">
          {(unfilteredCount ?? 0) === 0
            ? 'Nothing here yet. Add a card below.'
            : 'No cards match this filter.'}
        </p>
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
                isDragDisabled={isDragDisabled}
              >
                {(dragProvided, dragSnapshot) => (
                  <Card
                    innerRef={dragProvided.innerRef}
                    draggableProps={dragProvided.draggableProps}
                    dragHandleProps={dragProvided.dragHandleProps}
                    item={item}
                    isDragging={dragSnapshot.isDragging}
                    isPhotoLoading={photoLoadingId === item.id}
                    menuOpen={menuTaskId === item.id}
                    onToggleMenu={() =>
                      setMenuTaskId((prev) =>
                        prev === item.id ? null : item.id,
                      )
                    }
                    onOpenCard={(card) => {
                      onOpenCard(card)
                      setMenuTaskId(null)
                    }}
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
                    onDuplicate={onDuplicate}
                    onUpdateCardLabel={onUpdateCardLabel}
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
