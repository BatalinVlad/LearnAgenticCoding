/**
 * Soft monochromatic gradients from a user's accent color.
 * Use after sign-in for avatars, chips, etc. Backend can later send `accent` hex instead.
 */

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  }
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const l = (max + min) / 2
  let s = 0

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslFromHex(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

/**
 * Deterministic hue when no hex is available (e.g. future API user without color).
 * @param {number} userId
 */
export function hueFromUserId(userId) {
  const id = Number(userId)
  if (!Number.isFinite(id)) return 210
  return Math.abs((id * 137.508) % 360)
}

/**
 * Linear gradient: same hue, soft stop → even softer stop (readable as a light tint).
 * @param {string} [accentHex] - e.g. '#2ecc71'
 * @param {{ userId?: number }} [options] - fallback hue if hex missing
 * @returns {string} CSS `background-image` value
 */
export function getUserSoftGradient(accentHex, options = {}) {
  const hsl = accentHex ? hslFromHex(accentHex) : null
  const h = hsl ? hsl.h : hueFromUserId(options.userId ?? 0)
  const baseS = hsl ? hsl.s : 52

  const sSoft = Math.round(Math.min(50, 20 + baseS * 0.38))
  const sSofter = Math.round(Math.min(42, 12 + baseS * 0.26))
  const lSoft = 87
  const lSofter = 95

  return `linear-gradient(155deg, hsl(${h}, ${sSoft}%, ${lSoft}%) 0%, hsl(${h}, ${sSofter}%, ${lSofter}%) 100%)`
}

/**
 * Text / icon color on top of {@link getUserSoftGradient} for contrast.
 * @param {string} [accentHex]
 * @param {{ userId?: number }} [options]
 */
export function getUserSoftGradientForeground(accentHex, options = {}) {
  const hsl = accentHex ? hslFromHex(accentHex) : null
  const h = hsl ? hsl.h : hueFromUserId(options.userId ?? 0)
  return `hsl(${h}, 36%, 30%)`
}

/**
 * Softer → soft (same hue) for small badges on dark headers / cards: visibly tinted,
 * not near-white — use with {@link getUserSoftGradientForeground} for initials.
 * @param {string} [accentHex]
 * @param {{ userId?: number }} [options]
 */
export function getUserBoardAvatarGradient(accentHex, options = {}) {
  const hsl = accentHex ? hslFromHex(accentHex) : null
  const h = hsl ? hsl.h : hueFromUserId(options.userId ?? 0)
  const baseS = hsl ? hsl.s : 52
  const sSoft = Math.round(Math.min(55, 28 + baseS * 0.42))
  const sSofter = Math.round(Math.min(44, 18 + baseS * 0.3))
  const lSoft = 76
  const lSofter = 88
  return `linear-gradient(155deg, hsl(${h}, ${sSoft}%, ${lSoft}%) 0%, hsl(${h}, ${sSofter}%, ${lSofter}%) 100%)`
}
