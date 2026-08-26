// Pure-JS lunar math. No dependencies, safe to run on server or client.

const SYNODIC_MONTH = 29.53058867
// Known new moon reference: 2000-01-06 18:14 UTC (Julian Day 2451550.1)
const KNOWN_NEW_MOON_JD = 2451550.1

/** Convert a Date to its Julian Day number. */
function toJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

/** Returns the moon's age in days (0 to ~29.53). */
export function getLunarAge(date: Date = new Date()): number {
  const jd = toJulianDay(date)
  const daysSinceNew = jd - KNOWN_NEW_MOON_JD
  const age = daysSinceNew % SYNODIC_MONTH
  return age < 0 ? age + SYNODIC_MONTH : age
}

/** Returns the phase factor from 0 to 1 (0 = new, 0.5 = full, ~1 = new again). */
export function getPhaseFactor(date: Date = new Date()): number {
  return getLunarAge(date) / SYNODIC_MONTH
}

export { SYNODIC_MONTH }
