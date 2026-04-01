import { Column } from '../Column/Column.jsx'
import { ProgressFooter } from '../ProgressFooter/ProgressFooter.jsx'

export function PlaceholderColumn({ title }) {
  return (
    <Column title={title}>
      <form className="add add--disabled" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value=""
          placeholder="Enter a title for this card..."
          disabled
        />
        <button type="button" className="btn-add" disabled>
          Add
        </button>
      </form>
      <div className="list-scroll">
        <p className="empty">This column is ready for the next step.</p>
      </div>
      <ProgressFooter percent={0} labelRight="No tasks yet" />
    </Column>
  )
}
