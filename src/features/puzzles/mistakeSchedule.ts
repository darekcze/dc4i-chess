import type { PuzzleAttemptRow } from '../../db/db'

export type MemoryStatus = 'new' | 'due' | 'upcoming' | 'mastered'
export interface MemorySchedule { status: MemoryStatus; due: number | null; successes: number }

// Calendar-day arithmetic deliberately uses local midnight, not 24-hour durations (DST).
function day(timestamp: number): number {
  const d = new Date(timestamp)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
function addDays(timestamp: number, days: number): number {
  const d = new Date(timestamp)
  d.setDate(d.getDate() + days)
  return d.getTime()
}
const intervals = [1, 3, 7, 14, 30]

/** Rebuild from non-deleted, dated actual attempts; at most one success advances each day. */
export function mistakeSchedule(attempts: readonly PuzzleAttemptRow[], now = Date.now()): MemorySchedule {
  const today = day(now)
  const valid = attempts.filter((a) => a.mode === 'mistakes' && !a.deleted && typeof a.solved === 'boolean' && Number.isFinite(a.date) && a.date > 0 && a.date <= now)
    .slice().sort((a, b) => a.date - b.date || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  let successes = 0
  let due: number | null = null
  let successDay: number | null = null
  for (const a of valid) {
    const attemptDay = day(a.date)
    if (!a.solved) {
      successes = 0
      due = attemptDay // immediate retry; an unsuccessful retry remains due tomorrow too
      successDay = null
    } else if (successDay !== attemptDay && (due === null || attemptDay >= due)) {
      successes = Math.min(successes + 1, intervals.length)
      due = addDays(attemptDay, intervals[successes - 1])
      successDay = attemptDay
    }
  }
  if (due === null) return { status: 'new', due: null, successes: 0 }
  return { status: due <= today ? 'due' : successes >= intervals.length ? 'mastered' : 'upcoming', due, successes }
}
