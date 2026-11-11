import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import type { GameRow } from '../../db/db'
import type { MoveReview } from '../review/classify'
import { buildSkillInsights, WINDOW_MS } from './skillInsights/skillInsights'

const now = Date.UTC(2026, 10, 11, 12)
let version = 0
function game(date: number, extra: Partial<GameRow> = {}): GameRow {
  const chess = new Chess()
  const sans = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Nb8', 'd4', 'Nbd7']
  const moves: MoveReview[] = sans.map((san, i) => {
    const m = chess.move(san)
    return { ply: i + 1, san, uci: m.from + m.to, color: m.color, quality: i === 2 ? 'mistake' : 'good', loss: 1, accuracy: 80, bestUci: null, bestSan: null, scoreAfter: { cp: 0 } }
  })
  const id = `insight-${++version}`
  return { id, updatedAt: version, source: 'pgn', pgn: chess.pgn(), white: 'a', black: 'b', result: '1-0', userColor: 'w', date, opening: 'C60 Ruy Lopez: Other', review: { depth: 12, accuracy: { white: 80, black: 80 }, moves, curve: [] }, ...extra }
}

describe('buildSkillInsights', () => {
  it('uses consecutive half-open 30-day windows and excludes future games', () => {
    const rows = [now - 2 * WINDOW_MS - 1, now - 2 * WINDOW_MS, now - WINDOW_MS - 1, now - WINDOW_MS, now - 1, now, now + 1].map((d) => game(d))
    const result = buildSkillInsights(rows, now)
    expect(result.previous.games).toBe(2)
    expect(result.recent.games).toBe(2)
    expect(result.trend).toBeNull()
  })
  it('excludes deleted, unfinished, unreviewed, unknown-color, unreadable and zero-evaluated games', () => {
    const d = now - 1
    const noMoves = game(d)
    noMoves.review = { ...noMoves.review!, moves: [] }
    const rows = [game(d), game(d, { deleted: true }), game(d, { result: '*' }), game(d, { review: undefined }), game(d, { userColor: undefined }), game(d, { pgn: 'not valid chess' }), noMoves, game(NaN)]
    const result = buildSkillInsights(rows, now)
    expect(result.recent).toMatchObject({ games: 1, moves: 10, mistakes: 1, wins: 1, draws: 0, losses: 0, per100: null })
    expect(result.openings).toEqual([])
  })
  it('groups opening families, counts results from each colour, and computes rates and trend', () => {
    const recent = [game(now - 1), game(now - 2, { opening: 'C60 Ruy Lopez: Berlin', result: '1/2-1/2' }), game(now - 3, { opening: 'C60 Ruy Lopez', userColor: 'b', result: '0-1' })]
    const previous = Array.from({ length: 3 }, (_, i) => game(now - WINDOW_MS - i - 1))
    const result = buildSkillInsights([...recent, ...previous], now)
    expect(result.recent).toMatchObject({ games: 3, moves: 30, mistakes: 2, wins: 2, draws: 1, losses: 0 })
    expect(result.previous.per100).toBe(10)
    expect(result.trend).toBeCloseTo(-10 / 3)
    expect(result.colors.white).toMatchObject({ games: 2, wins: 1, draws: 1, per100: null })
    expect(result.colors.black).toMatchObject({ games: 1, wins: 1, per100: null })
    expect(result.openings).toHaveLength(1)
    expect(result.openings[0]).toMatchObject({ name: 'Ruy Lopez', games: 3, moves: 30, mistakes: 2 })
  })
  it('requires both thresholds for each group and preserves a genuine zero rate', () => {
    const rows = Array.from({ length: 3 }, (_, i) => {
      const g = game(now - i - 1, { opening: 'B20 Sicilian Defense: Variation' })
      g.review = { ...g.review!, moves: g.review!.moves.map((m) => ({ ...m, quality: 'good' })) }
      return g
    })
    const small = game(now - 5, { opening: 'C20 King Pawn' })
    const result = buildSkillInsights([...rows, small], now)
    expect(result.openings).toHaveLength(1)
    expect(result.openings[0]).toMatchObject({ name: 'Sicilian Defense', games: 3, moves: 30, per100: 0 })
    const short = rows.map((g) => ({ ...g, updatedAt: ++version, review: { ...g.review!, moves: g.review!.moves.filter((m) => m.ply !== 1) } }))
    expect(buildSkillInsights(short, now).recent).toMatchObject({ games: 3, moves: 27, per100: null })
    expect(buildSkillInsights(short, now).openings).toEqual([])
  })
  it('returns null rates for empty and small samples, and treats black losses correctly', () => {
    const empty = buildSkillInsights([], now)
    expect(empty.recent.per100).toBeNull()
    expect(empty.trend).toBeNull()
    expect(empty.topTheme).toBeNull()
    const result = buildSkillInsights([game(now - 1, { userColor: 'b', result: '1-0' })], now)
    expect(result.colors.black).toMatchObject({ losses: 1, wins: 0, per100: null })
  })
})
