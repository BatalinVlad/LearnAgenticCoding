/**
 * Five soft single-hue gradients (extra-light → soft) for card backgrounds.
 * ids 0–4 are persisted on the todo as `label`.
 */
export const CARD_LABELS = [
  {
    id: 0,
    name: 'Rose',
    /** extra-soft rose → soft rose */
    gradient: 'linear-gradient(148deg, #fff8f8 0%, #fecdd3 100%)',
  },
  {
    id: 1,
    name: 'Amber',
    gradient: 'linear-gradient(148deg, #fffbeb 0%, #fde68a 100%)',
  },
  {
    id: 2,
    name: 'Mint',
    gradient: 'linear-gradient(148deg, #f0fdf4 0%, #bbf7d0 100%)',
  },
  {
    id: 3,
    name: 'Sky',
    gradient: 'linear-gradient(148deg, #f0f9ff 0%, #bae6fd 100%)',
  },
  {
    id: 4,
    name: 'Lilac',
    gradient: 'linear-gradient(148deg, #faf5ff 0%, #e9d5ff 100%)',
  },
]

export function isValidCardLabelId(value) {
  if (value == null || value === '') return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 4 && Math.floor(n) === n
}
