const CONFETTI_COUNT = 28

export function ConfettiCelebration() {
  return (
    <div className="celebrate" aria-hidden="true">
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <span key={i} className="confetti" />
      ))}
    </div>
  )
}
