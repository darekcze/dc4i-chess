import { Chess } from 'chess.js'
import { splitPgn } from './sources'

export const MAX_SHARED_PGN_BYTES = 2 * 1024 * 1024
export const SHARED_PGN_KEY = 'szachy-pending-shares'
export const SHARED_PGN_EVENT = 'szachy-shared-pgn'
export type ShareError = 'too_large' | 'invalid' | 'unfinished' | 'unreadable' | 'timeout'
export type SharedPayload = { id?: string; text?: string; error?: ShareError; storageError?: boolean }

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
      if (chess.isCheckmate() && result !== (chess.turn() === 'w' ? '0-1' : '1-0')) return 'invalid'
      if ((chess.isStalemate() || chess.isInsufficientMaterial()) && result !== '1/2-1/2') return 'invalid'
      const header = chess.getHeaders().Result
      if (header && header !== result) return 'invalid'
    } catch {
      return 'invalid'
    }
  }
  return null
}

// Once storage fails, keep the complete queue in memory for this page lifetime.
let memoryQueue: SharedPayload[] | null = null

function readQueue(): SharedPayload[] {
  if (memoryQueue) return memoryQueue
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SHARED_PGN_KEY) || '[]')
    if (!Array.isArray(value)) throw new Error('Invalid share queue')
    return value as SharedPayload[]
  } catch {
    memoryQueue = []
    return memoryQueue
  }
}

function saveQueue(queue: SharedPayload[]): boolean {
  if (memoryQueue) { memoryQueue = queue; return false }
  try {
    if (queue.length) sessionStorage.setItem(SHARED_PGN_KEY, JSON.stringify(queue))
    else sessionStorage.removeItem(SHARED_PGN_KEY)
    return true
  } catch {
    queue.forEach((item) => { item.storageError = true })
    // Remove a stale snapshot when quota prevents replacing it.
    try { sessionStorage.removeItem(SHARED_PGN_KEY) } catch { /* unavailable */ }
    memoryQueue = queue
    return false
  }
}

export function enqueueSharedPayload(item: SharedPayload): void {
  const queue = readQueue().slice()
  if (item.id && queue.some((entry) => entry.id === item.id)) return
  queue.push(item)
  if (!saveQueue(queue)) item.storageError = true
}

export function peekSharedPayload(): SharedPayload | null {
  return readQueue()[0] ?? null
}

export function removeSharedPayload(): void {
  const queue = readQueue().slice()
  const removed = queue.shift()
  saveQueue(queue)
  if (removed?.id && typeof window !== 'undefined') {
    const bridge = (window as Window & { __szachyNativePort?: { postMessage: (id: string) => void } }).__szachyNativePort
    bridge?.postMessage(removed.id)
  }
}

// The native bridge waits for the lazy import page before invoking this handler.
if (typeof window !== 'undefined') {
  ;(window as Window & { __szachyEnqueueShare?: (payload: SharedPayload) => void }).__szachyEnqueueShare = (payload) => {
    enqueueSharedPayload(payload)
    window.dispatchEvent(new Event(SHARED_PGN_EVENT))
  }
}
