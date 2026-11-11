import { describe, expect, it } from 'vitest'
import type { PuzzleAttemptRow } from '../../db/db'
import { mistakeSchedule } from './mistakeSchedule'

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()
const row = (date: number, solved = true, extra: Partial<PuzzleAttemptRow> = {}): PuzzleAttemptRow => ({ id: String(date), puzzleId: 'm:g:2', mode: 'mistakes', rating: 0, updatedAt: date, date, solved, ...extra })
const now = at(2026, 3, 1)
describe('personal mistake schedule', () => {
  it('starts new without attempts', () => expect(mistakeSchedule([], now).status).toBe('new'))
  it('schedules first success tomorrow', () => expect(mistakeSchedule([row(now)], now)).toMatchObject({ status: 'upcoming', due: at(2026, 3, 2, 0), successes: 1 }))
  it('becomes due at local midnight', () => expect(mistakeSchedule([row(now)], at(2026, 3, 2, 0)).status).toBe('due'))
  it('failure is due immediately', () => expect(mistakeSchedule([row(now, false)], now).status).toBe('due'))
  it('failure stays due next day', () => expect(mistakeSchedule([row(now, false)], at(2026, 3, 2)).status).toBe('due'))
  it('successful retry schedules tomorrow', () => expect(mistakeSchedule([row(now, false), row(now + 1)], now + 1)).toMatchObject({ successes: 1, due: at(2026, 3, 2, 0) }))
  it('repeated same-day successes advance once', () => expect(mistakeSchedule([row(now), row(now + 1)], now + 1).successes).toBe(1))
  it('early practice does not advance', () => expect(mistakeSchedule([row(now), row(at(2026, 3, 2)), row(at(2026, 3, 3))], at(2026, 3, 3)).successes).toBe(2))
  it('second success schedules three days', () => expect(mistakeSchedule([row(now), row(at(2026, 3, 2))], at(2026, 3, 2)).due).toBe(at(2026, 3, 5, 0)))
  it('third success schedules seven days', () => expect(mistakeSchedule([row(now), row(at(2026, 3, 2)), row(at(2026, 3, 5))], at(2026, 3, 5)).due).toBe(at(2026, 3, 12, 0)))
  it('fourth success schedules fourteen days', () => expect(mistakeSchedule([row(now), row(at(2026, 3, 2)), row(at(2026, 3, 5)), row(at(2026, 3, 12))], at(2026, 3, 12)).due).toBe(at(2026, 3, 26, 0)))
  it('fifth success is mastered for thirty days', () => expect(mistakeSchedule([row(now), row(at(2026, 3, 2)), row(at(2026, 3, 5)), row(at(2026, 3, 12)), row(at(2026, 3, 26))], at(2026, 3, 26))).toMatchObject({ status: 'mastered', due: at(2026, 4, 25, 0) }))
  it('mastered becomes due again', () => expect(mistakeSchedule([row(now), row(at(2026, 3, 2)), row(at(2026, 3, 5)), row(at(2026, 3, 12)), row(at(2026, 3, 26))], at(2026, 4, 25)).status).toBe('due'))
  it('failure resets progress', () => expect(mistakeSchedule([row(now), row(at(2026, 3, 2), false)], at(2026, 3, 2))).toMatchObject({ status: 'due', successes: 0 }))
  it('ignores deleted rows', () => expect(mistakeSchedule([row(now, true, { deleted: true })], now).status).toBe('new'))
  it('ignores missing, negative, future and non-finite dates', () => expect(mistakeSchedule([row(0), row(-1), row(NaN), row(now + 1)], now).status).toBe('new'))
  it('ignores other modes', () => expect(mistakeSchedule([row(now, true, { mode: 'rated' })], now).status).toBe('new'))
  it('sorts imported attempts chronologically', () => expect(mistakeSchedule([row(at(2026, 3, 2)), row(now)], at(2026, 3, 2)).successes).toBe(2))
  it('uses local calendar days through spring DST', () => {
    const old = process.env.TZ
    process.env.TZ = 'Europe/Warsaw'
    try { expect(mistakeSchedule([row(at(2026, 3, 28))], at(2026, 3, 28)).due).toBe(at(2026, 3, 29, 0)); expect(mistakeSchedule([row(at(2026, 3, 29))], at(2026, 3, 29)).due).toBe(at(2026, 3, 30, 0)) } finally { process.env.TZ = old }
  })
  it('uses local calendar days through autumn DST', () => {
    const old = process.env.TZ
    process.env.TZ = 'Europe/Warsaw'
    try { expect(mistakeSchedule([row(at(2026, 10, 25))], at(2026, 10, 25)).due).toBe(at(2026, 10, 26, 0)) } finally { process.env.TZ = old }
  })
})
