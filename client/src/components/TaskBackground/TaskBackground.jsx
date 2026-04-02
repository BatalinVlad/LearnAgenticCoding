import { memo, useMemo } from 'react'
import './TaskBackground.css'

function themeToCssVars(theme) {
  if (!theme || typeof theme.base !== 'string') return undefined
  return {
    '--task-bg-base': theme.base,
    '--task-bg-bloom': theme.bloom,
    '--task-bg-orb-a': theme.orbA,
    '--task-bg-orb-b': theme.orbB,
    '--task-bg-orb-c': theme.orbC,
    '--task-bg-spark': theme.spark,
    '--task-bg-spark-glow': theme.sparkGlow,
    '--task-bg-float-glow': theme.floatGlow,
  }
}

/**
 * Decorative animated backdrop. Optional `backgroundUrl` sets a full-bleed photo
 * (from Unsplash, etc.) over the gradient; `animatedTheme` overrides palette while
 * keeping the same motion layers; memo avoids restarting animations.
 */
function TaskBackground({ backgroundUrl, animatedTheme }) {
  const photoMode = Boolean(backgroundUrl)
  const style = useMemo(
    () =>
      photoMode || !animatedTheme ? undefined : themeToCssVars(animatedTheme),
    [photoMode, animatedTheme],
  )
  return (
    <div
      className={'task-bg' + (photoMode ? ' task-bg--photo' : '')}
      style={style}
      aria-hidden="true"
    >
      {photoMode ? (
        <>
          <div
            className="task-bg__photo"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
          <div className="task-bg__photo-dim" />
        </>
      ) : null}
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
