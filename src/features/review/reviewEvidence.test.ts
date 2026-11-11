import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { reviewEvidence } from './reviewEvidence'
import type { StoredReview } from './explain'

function fixture() {
  const c = new Chess()
  const before = c.fen()
  c.move('d4')
  const after = c.fen()
  const review: StoredReview = {
    depth: 18, accuracy: { white: 90, black: 90 }, curve: [50, 48],
    moves: [{ ply: 1, san: 'd4', uci: 'd2d4', color: 'w', quality: 'mistake', loss: 3, accuracy: 90, bestUci: 'e2e4', bestSan: 'e4', scoreAfter: { cp: -20 } }],
    lines: [[{ multipv: 1, depth: 16, score: { cp: 30 }, pv: ['e2e4', 'e7e5', 'g1f3'] }], [{ multipv: 1, depth: 16, score: { cp: -20 }, pv: ['d7d5'] }]],
  }
  return { review, fens: [before, after] }
}

describe('reviewEvidence', () => {
  it('returns validated SAN, actual search depth and white POV evaluations', () => {
    const { review, fens } = fixture()
    expect(reviewEvidence(review, fens, 1)).toMatchObject({ playedSan: 'd4', bestSan: 'e4', line: ['e4', 'e5', 'Nf3'], depth: 16, reviewDepth: 18, before: { cp: 30 }, after: { cp: -20 }, explanation: null })
  })
  it('returns null without stored PV', () => { const f = fixture(); f.review.lines = undefined; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('returns null for an empty PV', () => { const f = fixture(); f.review.lines![0][0].pv = []; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('rejects malformed PV tokens', () => { const f = fixture(); f.review.lines![0][0].pv = ['e2e4junk']; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('rejects illegal continuations, not just the first move', () => { const f = fixture(); f.review.lines![0][0].pv = ['e2e4', 'e2e3']; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('requires matching best SAN', () => { const f = fixture(); f.review.moves[0].bestSan = null; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull(); f.review.moves[0].bestSan = 'd4'; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('requires matching best UCI and first PV move', () => { const f = fixture(); f.review.moves[0].bestUci = 'd2d4'; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('requires actual recorded depth', () => { const f = fixture(); f.review.depth = undefined as unknown as number; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull(); f.review.depth = 18; f.review.lines![0][0].depth = 0; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('rejects invalid ply and excessive PV', () => { const f = fixture(); for (const n of [0, -1, 2, 1.5, NaN]) expect(reviewEvidence(f.review, f.fens, n)).toBeNull(); f.review.lines![0][0].pv = Array(65).fill('e2e4'); expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('validates actual move and FEN', () => { const f = fixture(); f.review.moves[0].uci = 'e2e5'; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull(); f.fens[0] = 'bad'; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull() })
  it('keeps mate scores in white POV', () => { const f = fixture(); f.review.lines![0][0].score = { mate: -3 }; f.review.lines![1][0].score = { mate: 2 }; f.review.moves[0].scoreAfter = { mate: 2 }; expect(reviewEvidence(f.review, f.fens, 1)).toMatchObject({ before: { mate: -3 }, after: { mate: 2 } }) })
  it('supports black to move without reversing score', () => {
    const f = fixture(); const c = new Chess(); c.move('e4'); const before = c.fen(); c.move('c5'); const after = c.fen()
    f.fens = [before, after]; f.review.moves[0] = { ...f.review.moves[0], color: 'b', san: 'c5', uci: 'c7c5', bestSan: 'e5', bestUci: 'e7e5' }; f.review.lines![0][0].pv = ['e7e5', 'g1f3']; f.review.lines![1][0].pv = ['g1f3']
    expect(reviewEvidence(f.review, f.fens, 1)).toMatchObject({ playedSan: 'c5', line: ['e5', 'Nf3'], before: { cp: 30 }, after: { cp: -20 } })
    f.review.moves[0].color = 'w'; expect(reviewEvidence(f.review, f.fens, 1)).toBeNull()
  })
  it('omits unverified after evaluation when no position score was stored', () => { const f = fixture(); f.review.lines![1] = []; expect(reviewEvidence(f.review, f.fens, 1)?.after).toBeNull() })
})
