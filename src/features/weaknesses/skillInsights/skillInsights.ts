import type { GameRow } from '../../../db/db'
import { buildProfile, gameMistakes, openingFamily, PHASES } from '../profile'

/** Rolling windows are exact 24-hour days, inclusive at the start and exclusive at the end. */
export const WINDOW_MS = 30 * 24 * 60 * 60 * 1000
export const MIN_GAMES = 3
export const MIN_MOVES = 30

export interface Sample {
  games: number
  moves: number
  mistakes: number
  per100: number | null
  wins: number
  draws: number
  losses: number
}
export interface Insights {
  recent: Sample
  previous: Sample
  trend: number | null
  colors: { white: Sample; black: Sample }
  openings: (Sample & { name: string })[]
  topTheme: { theme: string; count: number } | null
}

function sample(games: GameRow[]): Sample {
  const profile = buildProfile(games)
  const wins = games.filter((g) => (g.userColor === 'w' && g.result === '1-0') || (g.userColor === 'b' && g.result === '0-1')).length
  const draws = games.filter((g) => g.result === '1/2-1/2').length
  return {
    games: profile.games, moves: profile.moves, mistakes: profile.mistakes.length,
    per100: profile.games >= MIN_GAMES && profile.moves >= MIN_MOVES ? profile.overall.per100 : null,
    wins, draws, losses: games.length - wins - draws,
  }
}

/** Only completed, reviewed, readable games with at least one evaluated user move are eligible. */
export function buildSkillInsights(games: GameRow[], now: number): Insights {
  const eligible = games.filter((g) => {
    if (g.deleted || !g.review || !g.userColor || !['1-0', '0-1', '1/2-1/2'].includes(g.result) || !Number.isFinite(g.date)) return false
    const result = gameMistakes(g)
    return !!result && PHASES.some((phase) => result.moves[phase] > 0)
  })
  const recentGames = eligible.filter((g) => g.date >= now - WINDOW_MS && g.date < now)
  const previousGames = eligible.filter((g) => g.date >= now - 2 * WINDOW_MS && g.date < now - WINDOW_MS)
  const recent = sample(recentGames)
  const previous = sample(previousGames)
  const groups = new Map<string, GameRow[]>()
  for (const game of recentGames) {
    const name = game.opening && openingFamily(game.opening)
    if (name) groups.set(name, [...(groups.get(name) ?? []), game])
  }
  const openings = [...groups].map(([name, group]) => ({ name, ...sample(group) }))
    .filter((group) => group.per100 !== null)
    .sort((a, b) => b.per100! - a.per100! || a.name.localeCompare(b.name))
  const top = buildProfile(recentGames).weaknesses[0]
  return {
    recent, previous,
    trend: recent.per100 === null || previous.per100 === null ? null : recent.per100 - previous.per100,
    colors: { white: sample(recentGames.filter((g) => g.userColor === 'w')), black: sample(recentGames.filter((g) => g.userColor === 'b')) },
    openings,
    topTheme: top && top.count >= 2 && recent.per100 !== null ? { theme: top.theme, count: top.count } : null,
  }
}
