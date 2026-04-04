import { CARD_LABELS } from '../../constants/cardLabels'

export function CardLabelSwatches({
  selectedId,
  onSelect,
  className = '',
}) {
  return (
    <div
      className={`card-label-swatches ${className}`.trim()}
      role="group"
      aria-label="Card label"
    >
      {CARD_LABELS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={
            'card-label-swatch' +
            (selectedId === opt.id ? ' card-label-swatch--active' : '')
          }
          style={{ background: opt.gradient }}
          onClick={() => onSelect(opt.id)}
          title={opt.name}
          aria-label={opt.name}
          aria-pressed={selectedId === opt.id}
        />
      ))}
      <button
        type="button"
        className="card-label-swatch card-label-swatch--clear"
        onClick={() => onSelect(null)}
        title="No label"
        aria-label="Clear label"
      >
        <span aria-hidden>∅</span>
      </button>
    </div>
  )
}
