import { Chess } from 'chess.js'
import { playUci } from '../../chess/util'
import type { Score } from '../../engine/engine'
import { terminalScore } from './classify'
import { explainPly, type Explanation, type StoredReview } from './explain'

export interface ReviewEvidence {
  playedSan: string
  bestSan: string
  line: string[]
  /** Depth actually reached for this line, not the requested review depth. */
  depth: number
  reviewDepth: number
  before: Score | null
  after: Score | null
  explanation: Explanation | null
}

const validScore = (s: Score | undefined): s is Score =>
  !!s && ((s.mate !== undefined && Number.isFinite(s.mate)) || (s.mate === undefined && s.cp !== undefined && Number.isFinite(s.cp)))

const sameScore = (a: Score | null | undefined, b: Score | null | undefined): boolean =>
  !!a && !!b && a.cp === b.cp && a.mate === b.mate

function sanLine(fen: string, pv: string[] | undefined): string[] | null {
  if (!Array.isArray(pv) || !pv.length || pv.length > 64) return null
  try {
    const chess = new Chess(fen)
    const result: string[] = []
    for (const uci of pv) {
      if (typeof uci !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null
      const move = playUci(chess, uci)
      if (!move) return null
      result.push(move.san)
    }
    return result
  } catch { return null }
}

/** Return evidence only when the stored alternative can be replayed in full. Scores use White's POV. */
export function reviewEvidence(review: StoredReview, fens: string[], ply: number): ReviewEvidence | null {
  if (!Number.isSafeInteger(ply) || ply < 1 || ply > review.moves.length || !fens[ply - 1] || !fens[ply]) return null
  if (!Number.isSafeInteger(review.depth) || review.depth < 1) return null
  const move = review.moves[ply - 1]
  const pv = review.lines?.[ply - 1]?.[0]
  if (!move || !pv || !Number.isSafeInteger(pv.depth) || pv.depth < 1 || !move.bestSan || !move.bestUci) return null
  try {
    const chess = new Chess(fens[ply - 1])
    if (chess.turn() !== move.color || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move.uci)) return null
    const actual = playUci(chess, move.uci)
    if (!actual || actual.san !== move.san || chess.fen() !== fens[ply]) return null
    const line = sanLine(fens[ply - 1], pv.pv)
    if (!line || pv.pv[0] !== move.bestUci || line[0] !== move.bestSan) return null
    const before = validScore(pv.score) ? pv.score : null
    const afterLine = review.lines?.[ply]?.[0]
    const afterCandidate = validScore(afterLine?.score) && sanLine(fens[ply], afterLine.pv) ? afterLine.score : terminalScore(fens[ply])
    const after = sameScore(afterCandidate, move.scoreAfter) ? afterCandidate : null
    // explainPly can fall back to the next move's bestUci; only pass it a verified reply.
    const reply = afterLine && sanLine(fens[ply], afterLine.pv) ? afterLine : undefined
    const safeMoves = review.moves.map((m, i) => i === ply ? { ...m, bestUci: null } : m)
    const safeLines = [...(review.lines ?? [])]
    safeLines[ply] = reply ? [reply] : []
    const previousScore = ply === 1 ? before : review.moves[ply - 2]?.scoreAfter
    const explanation = before && sameScore(before, previousScore) && validScore(move.scoreAfter) && after
      ? explainPly({ ...review, moves: safeMoves, lines: safeLines }, fens, ply) : null
    return { playedSan: actual.san, bestSan: line[0], line, depth: pv.depth, reviewDepth: review.depth, before, after, explanation }
  } catch { return null }
}
