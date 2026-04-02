import { Column } from '../Column/Column.jsx'
import { ProgressFooter } from '../ProgressFooter/ProgressFooter.jsx'
import { inputAutofillIgnoreProps } from '../../utils/inputAutofillIgnoreProps'

export function PlaceholderColumn({ title }) {
  return (
    <Column title={title}>
      <form
        className="add add--disabled"
        autoComplete="off"
        data-bwignore="true"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="text"
          id="placeholder-card-input"
          name="placeholder-card"
          value=""
          placeholder="Enter a title for this card..."
          disabled
          {...inputAutofillIgnoreProps}
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
