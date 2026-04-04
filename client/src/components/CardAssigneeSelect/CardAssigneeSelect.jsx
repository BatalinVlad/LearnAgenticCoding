import { useAuth } from '../../context/AuthContext'
import {
  getUserBoardAvatarGradient,
  getUserSoftGradientForeground,
} from '../../utils/userColorGradient'

/**
 * @param {object} props
 * @param {number|null|undefined} props.value — member id or null
 * @param {(id: number | null) => void} props.onChange
 * @param {string} [props.idPrefix]
 * @param {string} [props.className]
 * @param {string} [props.selectClassName] — extra class
 * @param {boolean} [props.showLabel] — set false for compact card menu
 */
export function CardAssigneeSelect({
  value,
  onChange,
  idPrefix = 'card-assignee',
  className = '',
  selectClassName = '',
  showLabel = true,
}) {
  const { members: boardMembers } = useAuth()
  const sid = `${idPrefix}-select`
  return (
    <div className={`card-assignee-field ${className}`.trim()}>
      {showLabel ? (
        <span className="card-assignee-field__label" id={sid}>
          Assignee
        </span>
      ) : null}
      <div
        className={`card-assignee-avatars ${selectClassName}`.trim()}
        role="radiogroup"
        aria-labelledby={showLabel ? sid : undefined}
      >
        <button
          type="button"
          role="radio"
          aria-checked={value == null}
          className={`card-assignee-avatar card-assignee-avatar--unassigned ${value == null ? 'is-selected' : ''}`}
          onClick={() => onChange(null)}
          title="Unassigned"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        {boardMembers.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={value === m.id}
            className={`card-assignee-avatar ${value === m.id ? 'is-selected' : ''}`}
            style={{
              backgroundImage: getUserBoardAvatarGradient(m.color, {
                userId: m.id,
              }),
              color: getUserSoftGradientForeground(m.color, { userId: m.id }),
            }}
            onClick={() => onChange(m.id)}
            title={`${m.name} (@${m.username})`}
          >
            {m.initials}
          </button>
        ))}
      </div>
    </div>
  )
}
