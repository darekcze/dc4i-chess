import { db, type GameRow } from '../../db/db'
import type { Quality } from '../review/classify'
import { parseGame } from '../review/analyze'
import type { Puzzle } from './puzzlesData'
import { Chess } from 'chess.js'
import { sharedEngine, type Score } from '../../engine/engine'
import { playUci } from '../../chess/util'
import { mistakeSchedule, type MemorySchedule } from './mistakeSchedule'

export interface MistakePuzzle extends Puzzle {
  gameId: string
  /** the move that was played instead */
  san: string
  quality: Quality
  opponent: string
  schedule?: MemorySchedule
}

const BAD: Quality[] = ['blunder', 'miss', 'mistake']

/**
 * Exercises from the user's own reviewed games: the position after the opponent's move,
 * where the user went wrong, and the engine's best move as the answer.
 */
export function mistakesFromGame(game: GameRow): MistakePuzzle[] {
  const review = game.review
  if (!review || !game.userColor) return []
  let parsed: ReturnType<typeof parseGame>
  try {
    parsed = parseGame(game.pgn)
  } catch {
    return []
  }
  const out: MistakePuzzle[] = []
  for (const m of review.moves) {
    if (m.color !== game.userColor || !BAD.includes(m.quality) || !m.bestUci || m.ply < 2) continue
    // puzzles start one move earlier: the opponent's move is the setup, as in the Lichess set
    out.push({
      id: `m:${game.id}:${m.ply}`,
      fen: parsed.fens[m.ply - 2],
      moves: [parsed.moves[m.ply - 2].uci, m.bestUci],
      rating: 0,
      themes: [],
      gameId: game.id,
      san: m.san,
      quality: m.quality,
      opponent: game.userColor === 'w' ? game.black : game.white,
    })
  }
  return out
}

/** Prioritize due and new puzzles; keep unsolved and worst-first ordering within each group. */
export async function mistakePuzzles(): Promise<MistakePuzzle[]> {
  const [games, attempts] = await Promise.all([
    db.games.filter((g) => !g.deleted && !!g.review && !!g.userColor).toArray(),
    db.puzzleAttempts.where('mode').equals('mistakes').toArray(),
  ])
  const byPuzzle = new Map<string, typeof attempts>()
  for (const a of attempts) {
    const rows = byPuzzle.get(a.puzzleId) ?? []
    rows.push(a)
    byPuzzle.set(a.puzzleId, rows)
  }
  const solved = new Set(attempts.filter((a) => a.solved && !a.deleted).map((a) => a.puzzleId))
  const priority = { due: 0, new: 1, upcoming: 2, mastered: 2 } as const
  const now = Date.now()
  const rank = (q: Quality) => BAD.indexOf(q)
  return games
    .sort((a, b) => b.date - a.date)
    .flatMap(mistakesFromGame)
    .map((p) => ({ ...p, schedule: mistakeSchedule(byPuzzle.get(p.id) ?? [], now) }))
    .sort((a, b) => priority[a.schedule.status] - priority[b.schedule.status] || Number(solved.has(a.id)) - Number(solved.has(b.id)) || rank(a.quality) - rank(b.quality))
}

/** How much worse than the engine's move another answer may be and still count. */
export const ALT_MARGIN = 50
/** An answer that keeps at least this edge counts even when the best move wins more. */
export const ALT_WINNING = 300

/** A score as centipawns for `color`, mates folded in as huge values (nearer mates higher). */
export function cpFor(score: Score, color: 'w' | 'b'): number {
  const sign = color === 'w' ? 1 : -1
  if (score.mate !== undefined) return sign * (score.mate >= 0 ? 100_000 - score.mate : -100_000 - score.mate)
  return sign * (score.cp ?? 0)
}

/** Whether an answer scored `alt` is as good as the best one scored `best` (both for the solver). */
export function goodEnough(best: number, alt: number): boolean {
  // A centipawn advantage cannot substitute for a forced mating line.
  if (best >= 90_000 && alt < 90_000) return false
  return alt >= best - ALT_MARGIN || alt >= ALT_WINNING
}

const DEPTH = 12

/** Score (for `color`, who plays `uci`) of the position after it, or null when the engine gave none. */
async function scoreAfter(fen: string, uci: string, color: 'w' | 'b'): Promise<number | null> {
  const c = new Chess(fen)
  if (!playUci(c, uci)) return null
  if (c.isCheckmate()) return 100_000
  if (c.isDraw()) return 0
  const r = await sharedEngine().search(c.fen(), { depth: DEPTH })
  const line = r.lines[0]
  // a search cut short by another one is no verdict
  if (!line || r.depth < DEPTH - 4) return null
  return cpFor(line.score, color)
}

/**
 * Engine check for a mistake puzzle answer that isn't the stored best move: accepted when it is
 * within ALT_MARGIN of the best move at a quick depth, or still clearly winning.
 */
export async function isGoodAlternative(fen: string, uci: string, bestUci: string): Promise<boolean> {
  const color = new Chess(fen).turn()
  const alt = await scoreAfter(fen, uci, color)
  if (alt === null) return false
  const best = await scoreAfter(fen, bestUci, color)
  return best !== null && goodEnough(best, alt)
}
