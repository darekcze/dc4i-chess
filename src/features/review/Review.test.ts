import { describe, expect, it } from 'vitest'
import { reviewForDisplay, REPORT_COPY } from './Review'
import { annotatedPgn } from './pgnExport'
import type { GameRow } from '../../db/db'

describe('review display', () => {
  it('preserves stored brilliant and great classifications and agrees with PGN export', () => {
    const game = { pgn: '1. e4 e5', review: { depth: 4, moves: [
      { san: 'e4', quality: 'brilliant', scoreAfter: { cp: 10 } },
      { san: 'e5', quality: 'great', scoreAfter: { cp: 0 } },
    ] } } as GameRow
    const original = structuredClone(game)
    const display = reviewForDisplay(game.review)
    expect(display?.moves.map((m) => m.quality)).toEqual(['brilliant', 'great'])
    const pgn = annotatedPgn(game, (q) => q)
    expect(pgn).toContain('!! brilliant.')
    expect(pgn).toContain('! great.')
    expect(game).toEqual(original)
  })
  it('describes legacy scores as recorded and does not claim verification', () => {
    for (const copy of Object.values(REPORT_COPY)) {
      expect(copy.eval.toLowerCase()).toMatch(/recorded|zapisane/)
      expect(Object.values(copy).join(' ').toLowerCase()).not.toMatch(/verified|zweryfikowan/)
    }
  })
})
