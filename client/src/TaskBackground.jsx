import { memo } from 'react'
import './TaskBackground.css'

/**
 * Decorative animated backdrop — independent of todo state (no props).
 * Wrapped in memo so parent re-renders (checkbox, API) do not restart animations.
 */
function TaskBackground() {
  return (
    <div className="task-bg" aria-hidden="true">
      <div className="task-bg__base" />
      <div className="task-bg__bloom" />
      <div className="task-bg__orb task-bg__orb--a" />
      <div className="task-bg__orb task-bg__orb--b" />
      <div className="task-bg__orb task-bg__orb--c" />
      <div className="task-bg__mesh" />
      <div className="task-bg__grid" />

      <div className="task-bg__floats">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="task-bg__float" data-i={i} />
        ))}
      </div>

      <div className="task-bg__rise">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className="task-bg__spark" data-i={i} />
        ))}
      </div>
    </div>
  )
}

export default memo(TaskBackground)
