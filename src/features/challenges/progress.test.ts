import { describe, expect, it } from 'vitest'
import type { GameRow, PuzzleAttemptRow } from '../../db/db'
import { calculateProgress, dayKey, offsetDay } from './progress'

const now = new Date(2026, 2, 30, 12)
const at = (offset: number, hour = 10) => { const d = offsetDay(now, offset); d.setHours(hour); return d.getTime() }
const attempt = (id: string, date = at(0), more: Partial<PuzzleAttemptRow> = {}): PuzzleAttemptRow => ({ id, puzzleId: id, date, updatedAt: date, rating: 1000, mode: 'rated', solved: true, ...more })
const game = (id: string, date = at(0), more: Partial<GameRow> = {}): GameRow => ({ id, date, updatedAt: date, source: 'bot', result: '1-0', pgn: '', white: '', black: '', ...more })

describe('offline challenge progress', () => {
  it('starts empty', () => {
    const p = calculateProgress([], [], now)
    expect(p.today).toMatchObject({ puzzles: 0, mistakes: 0, games: 0, completed: 0, active: false })
    expect(p.week).toHaveLength(7)
    expect(p.streak).toBe(0)
    expect(p.longestStreak).toBe(0)
  })
  it('counts only solved, distinct puzzles per local day, including mistake mode', () => {
    const rows = [attempt('a'), attempt('again', at(0), { puzzleId: 'a' }), attempt('fail', at(0), { solved: false }), attempt('m1', at(0), { mode: 'mistakes' }), attempt('m2', at(0), { mode: 'mistakes' }), attempt('b'), attempt('c')]
    const p = calculateProgress(rows, [], now)
    expect(p.today).toMatchObject({ puzzles: 5, mistakes: 2, completed: 2 })
    expect(p.totals.puzzles).toBe(5)
  })
  it('ignores tombstones, unfinished games, other sources and future events', () => {
    const p = calculateProgress([attempt('deleted', at(0), { deleted: true }), attempt('future', at(1))], [game('deleted', at(0), { deleted: true }), game('unfinished', at(0), { result: '*' }), game('local', at(0), { source: 'local' }), game('future', at(1)), game('real')], now)
    expect(p.today).toMatchObject({ puzzles: 0, games: 1, completed: 1 })
    expect(p.totals).toEqual({ puzzles: 0, mistakes: 0, games: 1 })
    expect(calculateProgress([], [], now).totals.games).toBe(0)
  })
  it('uses local calendar days and permits the same puzzle on another day', () => {
    const justBefore = new Date(2026, 2, 29, 23, 59).getTime()
    const justAfter = new Date(2026, 2, 30, 0, 1).getTime()
    const p = calculateProgress([attempt('x', justBefore), attempt('again', justAfter, { puzzleId: 'x' })], [], now)
    expect(p.week.slice(-2).map((d) => d.puzzles)).toEqual([1, 1])
    expect(p.totals.puzzles).toBe(1)
    expect(dayKey(offsetDay(now, -1))).toBe('2026-03-29')
  })
  it('keeps a current streak through yesterday and records historical best', () => {
    const p = calculateProgress([attempt('a', at(-4)), attempt('b', at(-3)), attempt('c', at(-2)), attempt('d', at(-1))], [], now)
    expect(p.streak).toBe(4)
    expect(p.longestStreak).toBe(4)
    const broken = calculateProgress([attempt('a', at(-4)), attempt('b', at(-3)), attempt('c', at(-2))], [], now)
    expect(broken.streak).toBe(0)
    expect(broken.longestStreak).toBe(3)
    expect(calculateProgress([attempt('a', at(-1)), attempt('b')], [], now).streak).toBe(2)
  })
})
