/** @param {string|null|undefined} isoYmd */
export function formatDueDateShort(isoYmd) {
  if (!isoYmd || typeof isoYmd !== 'string') return ''
  const d = new Date(isoYmd + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** @param {string|null|undefined} isoYmd */
export function isDueDateOverdue(isoYmd) {
  if (!isoYmd || typeof isoYmd !== 'string') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(isoYmd + 'T12:00:00')
  if (Number.isNaN(due.getTime())) return false
  due.setHours(0, 0, 0, 0)
  return due < today
}

/** @param {string|null|undefined} isoYmd */
export function isDueDateToday(isoYmd) {
  if (!isoYmd || typeof isoYmd !== 'string') return false
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const da = String(today.getDate()).padStart(2, '0')
  return isoYmd === `${y}-${m}-${da}`
}

/** @param {string|null|undefined} v */
export function toDateInputValue(v) {
  if (!v || typeof v !== 'string') return ''
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''
}
