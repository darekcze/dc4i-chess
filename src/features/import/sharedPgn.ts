import { Chess } from 'chess.js'
import { splitPgn } from './sources'

export const MAX_SHARED_PGN_BYTES = 2 * 1024 * 1024
export const SHARED_PGN_KEY = 'szachy-pending-shares'
export const SHARED_PGN_EVENT = 'szachy-shared-pgn'
export type ShareError = 'too_large' | 'invalid' | 'unfinished' | 'unreadable'
export type SharedPayload = { text?: string; error?: ShareError }

/** Every shared game must have legal moves and an explicit, consistent final result. */
export function validateSharedPgn(text: string): ShareError | null {
  if (new TextEncoder().encode(text).length > MAX_SHARED_PGN_BYTES) return 'too_large'
  if (!text.trim() || Array.from(text).some((char) => {
    const code = char.codePointAt(0)!
    return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127 || code === 0xfffd
  })) return 'invalid'
  const games = splitPgn(text)
  if (!games.length) return 'invalid'
  for (const game of games) {
    // Ignore comments and recursive annotation variations when finding the main-line result.
    let moves = game.replace(/^\s*\[[^\n]*\]\s*$/gm, '').replace(/\{[^}]*\}|;[^\n]*/g, '')
    let previous: string
    do {
      previous = moves
      moves = moves.replace(/\([^()]*\)/g, '')
    } while (moves !== previous)
    const result = moves.trim().match(/(?:^|\s)(1-0|0-1|1\/2-1\/2|\*)\s*$/)?.[1]
    if (!result || result === '*') return 'unfinished'
    const headerResult = game.match(/^\s*\[Result\s+"([^"]*)"\]\s*$/m)?.[1]
    if (headerResult && headerResult !== result) return 'invalid'
    try {
      const chess = new Chess()
      chess.loadPgn(game, { strict: true })
      if (!chess.history().length) return 'invalid'
      const header = chess.getHeaders().Result
      if (header && header !== result) return 'invalid'
    } catch {
      return 'invalid'
    }
  }
  return null
}

export function peekSharedPayload(): SharedPayload | null {
  try {
    const queue: SharedPayload[] = JSON.parse(sessionStorage.getItem(SHARED_PGN_KEY) || '[]')
    if (!Array.isArray(queue) || !queue.length) return null
    return queue[0] ?? null
  } catch {
    return null
  }
}

export function removeSharedPayload(): void {
  try {
    const queue: SharedPayload[] = JSON.parse(sessionStorage.getItem(SHARED_PGN_KEY) || '[]')
    if (!Array.isArray(queue)) return
    queue.shift()
    if (queue.length) sessionStorage.setItem(SHARED_PGN_KEY, JSON.stringify(queue))
    else sessionStorage.removeItem(SHARED_PGN_KEY)
  } catch {
    // Storage can be unavailable in private browsing.
  }
}
