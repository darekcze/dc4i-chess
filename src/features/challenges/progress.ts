import type { GameRow, PuzzleAttemptRow } from '../../db/db'

/** Calendar keys and arithmetic use local dates, including across DST changes. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function offsetDay(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset, 12)
}

export interface DayProgress {
  key: string
  puzzles: number
  mistakes: number
  games: number
  completed: number
  active: boolean
}

export function calculateProgress(attempts: PuzzleAttemptRow[], games: GameRow[], now = new Date()) {
  const today = dayKey(now)
  const days = new Map<string, { puzzles: Set<string>; mistakes: Set<string>; games: Set<string> }>()
  const allPuzzles = new Set<string>()
  const allMistakes = new Set<string>()
  const allGames = new Set<string>()
  const getDay = (key: string) => {
    let day = days.get(key)
    if (!day) {
      day = { puzzles: new Set(), mistakes: new Set(), games: new Set() }
      days.set(key, day)
    }
    return day
  }
  for (const a of attempts) {
    if (a.deleted || !a.solved || !a.puzzleId || !Number.isFinite(a.date)) continue
    const date = new Date(a.date)
    if (Number.isNaN(date.getTime()) || a.date > now.getTime()) continue
    const day = getDay(dayKey(date))
    day.puzzles.add(a.puzzleId)
    allPuzzles.add(a.puzzleId)
    if (a.mode === 'mistakes') {
      day.mistakes.add(a.puzzleId)
      allMistakes.add(a.puzzleId)
    }
  }
  for (const g of games) {
    if (g.deleted || g.source !== 'bot' || !g.id || !['1-0', '0-1', '1/2-1/2'].includes(g.result) || !Number.isFinite(g.date)) continue
    const date = new Date(g.date)
    if (Number.isNaN(date.getTime()) || g.date > now.getTime()) continue
    getDay(dayKey(date)).games.add(g.id)
    allGames.add(g.id)
  }
  const progressFor = (date: Date): DayProgress => {
    const key = dayKey(date)
    const day = days.get(key)
    const puzzles = day?.puzzles.size ?? 0
    const mistakes = day?.mistakes.size ?? 0
    const games = day?.games.size ?? 0
    return { key, puzzles, mistakes, games, completed: Number(puzzles >= 5) + Number(mistakes >= 2) + Number(games >= 1), active: puzzles + games > 0 }
  }
  const week = Array.from({ length: 7 }, (_, i) => progressFor(offsetDay(now, i - 6)))
  let streak = 0
  let cursor = days.has(today) ? 0 : -1
  while (days.has(dayKey(offsetDay(now, cursor)))) { streak++; cursor-- }
  let longestStreak = 0
  let run = 0
  let previous = ''
  for (const key of [...days.keys()].sort()) {
    const [year, month, day] = key.split('-').map(Number)
    const yesterday = dayKey(new Date(year, month - 1, day - 1, 12))
    run = previous === yesterday ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
    previous = key
  }
  return { today: progressFor(now), week, streak, longestStreak, totals: { puzzles: allPuzzles.size, mistakes: allMistakes.size, games: allGames.size } }
}
