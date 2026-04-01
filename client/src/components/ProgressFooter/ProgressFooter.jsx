export function ProgressFooter({ percent, labelRight }) {
  return (
    <footer className="progress-footer" aria-label="Completion progress">
      <div className="progress-label">
        <span className="progress-percent">{percent}%</span>
        <span className="progress-meta">{labelRight}</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </footer>
  )
}
