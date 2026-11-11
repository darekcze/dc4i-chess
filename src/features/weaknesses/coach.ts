import type { Profile } from './profile'

/** The plan is based only on completed, reviewed imports supplied by the caller. */
export function coachPlan(profile: Profile) {
  const weakness = profile.weaknesses[0]
  const example = weakness?.examples[0] ?? profile.mistakes[0]
  return {
    theme: weakness?.theme ?? null,
    count: weakness?.count ?? 0,
    lesson: ({ fork: 'forks', pin: 'pin', hangingPiece: 'hanging-pieces', mate: 'mate-in-one', mateIn1: 'mate-in-one' } as Record<string, string>)[weakness?.theme ?? ''] ?? 'hanging-pieces',
    example: example ? { gameId: example.gameId, ply: example.ply } : null,
  }
}

export function coachPuzzleProgress(theme: string | null, day: string, attempts: { date: number; mode: string; theme?: string; solved: boolean; deleted?: boolean }[]) {
  if (!theme) return 0
  return attempts.filter((a) => {
    const d = new Date(a.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return !a.deleted && a.solved && a.mode === 'theme' && a.theme === theme && key === day
  }).length
}
