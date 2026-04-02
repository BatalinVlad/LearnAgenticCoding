/** One randomized “TaskBackground” palette: same layers/animations, new colors. */

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

function hsla(h, s, l, a) {
  return `hsla(${Math.round(h % 360)}, ${clamp(s, 0, 100)}%, ${clamp(l, 0, 100)}%, ${clamp(a, 0, 1)})`
}

function rand(min, max) {
  return min + Math.random() * (max - min)
}

/** @returns {Record<string, string> & { v?: number }} Serializable CSS-ready strings */
export function generateAnimatedBackgroundTheme() {
  const root = rand(0, 360)
  const spread = 35 + rand(0, 55)
  const h0 = root
  const h1 = root + spread * 0.45
  const h2 = root + spread * 0.9
  const h3 = root + spread * 1.35

  const base0 = hsla(h0, 42 + rand(0, 18), 8 + rand(0, 8), 1)
  const base1 = hsla(h1, 48 + rand(0, 22), 12 + rand(0, 10), 1)
  const base2 = hsla(h2, 52 + rand(0, 18), 14 + rand(0, 9), 1)
  const base3 = hsla(h3, 45 + rand(0, 25), 10 + rand(0, 14), 1)

  const angle = Math.round(150 + rand(0, 45))

  const accent = root + rand(80, 140)
  const bloom1 = hsla(accent, 72 + rand(0, 18), 48 + rand(0, 12), 0.32 + rand(0, 0.1))
  const bloom2 = hsla(accent + 12, 65, 40 + rand(0, 8), 0.12 + rand(0, 0.08))

  const ohA = root + rand(55, 110)
  const ohB = root + rand(150, 220)
  const ohC = root + rand(240, 320)

  const orbOpacity = 0.38 + rand(0, 0.18)
  const orbA = hsla(ohA, 62 + rand(0, 22), 52 + rand(0, 12), orbOpacity)
  const orbB = hsla(ohB, 58 + rand(0, 20), 48 + rand(0, 14), orbOpacity * 0.75)
  const orbC = hsla(ohC, 68 + rand(0, 15), 54 + rand(0, 10), orbOpacity * 0.65)

  const sparkHue = accent + rand(-25, 25)
  const sparkTop = hsla(sparkHue, 78, 58, 0.88)
  const sparkBot = hsla(sparkHue + 18, 70, 62, 0.38)
  const sparkGlow = hsla(sparkHue, 85, 55, 0.58)

  const floatGlow = hsla(accent, 70, 50, 0.1 + rand(0, 0.12))

  return {
    v: 1,
    base: `linear-gradient(${angle}deg, ${base0} 0%, ${base1} 34%, ${base2} 68%, ${base3} 100%)`,
    bloom: `radial-gradient(circle at 50% 85%, ${bloom1} 0%, ${bloom2} 36%, transparent 56%)`,
    orbA,
    orbB,
    orbC,
    spark: `linear-gradient(180deg, ${sparkTop}, ${sparkBot})`,
    sparkGlow,
    floatGlow,
  }
}
