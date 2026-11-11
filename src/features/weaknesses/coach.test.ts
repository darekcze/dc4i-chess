import { describe, expect, it } from 'vitest'
import { coachPlan, coachPuzzleProgress } from './coach'
import type { Profile } from './profile'

describe('daily coach', () => {
  it('uses the most frequent weakness and links to its real example', () => {
    const p = { weaknesses: [{ theme: 'fork', count: 4, examples: [{ gameId: 'g1', ply: 7 }] }], mistakes: [] } as unknown as Profile
    expect(coachPlan(p)).toEqual({ theme: 'fork', count: 4, lesson: 'forks', example: { gameId: 'g1', ply: 7 } })
  })
  it('counts only solved, matching, non-deleted attempts on the local day', () => {
    const date = new Date(2026, 10, 11, 12).getTime()
    const attempt = { date, mode: 'theme', theme: 'fork', solved: true }
    expect(coachPuzzleProgress('fork', '2026-11-11', [attempt, { ...attempt, solved: false }, { ...attempt, deleted: true }, { ...attempt, theme: 'pin' }, { ...attempt, date: date - 86400000 }])).toBe(1)
    expect(coachPuzzleProgress(null, '2026-11-11', [attempt])).toBe(0)
  })
})
