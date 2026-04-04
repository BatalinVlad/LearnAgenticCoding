/**
 * Soft single-hue gradients (extra-light → soft) for card backgrounds.
 * ids 0–10 are persisted on the todo as `label`.
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
  {
    id: 5,
    name: 'Peach',
    gradient: 'linear-gradient(148deg, #fff7ed 0%, #fed7aa 100%)',
  },
  {
    id: 6,
    name: 'Teal',
    gradient: 'linear-gradient(148deg, #f0fdfa 0%, #99f6e4 100%)',
  },
  {
    id: 7,
    name: 'Indigo',
    gradient: 'linear-gradient(148deg, #eef2ff 0%, #c7d2fe 100%)',
  },
  {
    id: 8,
    name: 'Blush',
    gradient: 'linear-gradient(148deg, #fdf2f8 0%, #fbcfe8 100%)',
  },
  {
    id: 9,
    name: 'Lime',
    gradient: 'linear-gradient(148deg, #f7fee7 0%, #d9f99d 100%)',
  },
  {
    id: 10,
    name: 'Mist',
    gradient: 'linear-gradient(148deg, #f8fafc 0%, #cbd5e1 100%)',
  },
]

export function isValidCardLabelId(value) {
  if (value == null || value === '') return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 10 && Math.floor(n) === n
}
