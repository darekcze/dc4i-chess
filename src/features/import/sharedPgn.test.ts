import { describe, expect, it, vi } from 'vitest'
import { MAX_SHARED_PGN_BYTES, validateSharedPgn } from './sharedPgn'

const game = '[Event "Friendly"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0'

describe('shared PGN validation', () => {
  it('accepts legal completed games, including resignation and multiple games', () => {
    expect(validateSharedPgn(game)).toBeNull()
    expect(validateSharedPgn(`${game}\n\n[Event "Other"]\n\n1. d4 d5 1/2-1/2`)).toBeNull()
  })
  it('rejects unfinished, missing, inconsistent, or illegal results', () => {
    for (const text of ['1. e4 e5 *', '1. e4 e5', '[Result "1-0"]\n\n1. e4 e5 *', '[Result "0-1"]\n\n1. e4 e5 1-0', '1. e4 e5 2. Ke2 Ke7 3. Qh9 1-0', 'not pgn 1-0']) {
      expect(validateSharedPgn(text), text).not.toBeNull()
    }
  })
  it('rejects binary and injected strings, while allowing ordinary text in comments', () => {
    expect(validateSharedPgn('1. e4\u0000 e5 1-0')).not.toBeNull()
    expect(validateSharedPgn('</script><script>alert(1)</script> 1-0')).not.toBeNull()
    expect(validateSharedPgn('1. e4 {"</script>\\\'"} e5 1-0')).toBeNull()
  })
  it('enforces the UTF-8 byte cap', () => {
    expect(validateSharedPgn('x'.repeat(MAX_SHARED_PGN_BYTES + 1))).toBe('too_large')
    expect(validateSharedPgn('ą'.repeat(MAX_SHARED_PGN_BYTES / 2 + 1))).toBe('too_large')
  })
})

describe('pending share queue', () => {
  it('retains each share until it is explicitly removed', async () => {
    const { SHARED_PGN_KEY, peekSharedPayload, removeSharedPayload } = await import('./sharedPgn')
    const items = new Map<string, string>()
    const storage = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => { items.set(key, value) },
      removeItem: (key: string) => { items.delete(key) },
    }
    const old = globalThis.sessionStorage
    Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true })
    try {
      storage.setItem(SHARED_PGN_KEY, JSON.stringify([{ text: game }, { error: 'unreadable' }]))
      expect(peekSharedPayload()).toEqual({ text: game })
      expect(peekSharedPayload()).toEqual({ text: game })
      removeSharedPayload()
      expect(peekSharedPayload()).toEqual({ error: 'unreadable' })
      removeSharedPayload()
      expect(peekSharedPayload()).toBeNull()
    } finally {
      Object.defineProperty(globalThis, 'sessionStorage', { value: old, configurable: true })
    }
  })
})

describe('terminal results', () => {
  it('rejects results contradictory to mate and accepts Chess.com clock comments', () => {
    expect(validateSharedPgn('1. f3 e5 2. g4 Qh4# 1-0')).toBe('invalid')
    expect(validateSharedPgn('1. f3 e5 2. g4 Qh4# 0-1')).toBeNull()
    expect(validateSharedPgn('[Event "Live Chess"]\n[Result "1-0"]\n[Termination "White won on time"]\n\n1. e4 {[%clk 0:10:00]} e5 {[%clk 0:09:58]} 1-0')).toBeNull()
  })
})

describe('storage failure recovery', () => {
  it('keeps multiple shares accessible when session storage throws', async () => {
    vi.resetModules()
    const { enqueueSharedPayload, peekSharedPayload, removeSharedPayload } = await import('./sharedPgn')
    const old = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('unavailable') } })
    try {
      enqueueSharedPayload({ id: 'a', text: game })
      enqueueSharedPayload({ id: 'b', error: 'invalid' })
      expect(peekSharedPayload()).toMatchObject({ id: 'a', text: game, storageError: true })
      removeSharedPayload()
      expect(peekSharedPayload()).toMatchObject({ id: 'b', error: 'invalid' })
      removeSharedPayload()
    } finally {
      if (old) Object.defineProperty(globalThis, 'sessionStorage', old)
      else Reflect.deleteProperty(globalThis, 'sessionStorage')
    }
  })
})


it('preserves the existing queue when storage quota is exceeded', async () => {
  vi.resetModules()
  const { SHARED_PGN_KEY, enqueueSharedPayload, peekSharedPayload, removeSharedPayload } = await import('./sharedPgn')
  const old = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  const existing = JSON.stringify([{ id: 'first', text: game }])
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => key === SHARED_PGN_KEY ? existing : null,
    setItem: () => { throw new DOMException('Quota exceeded', 'QuotaExceededError') },
    removeItem: () => {},
  } })
  try {
    enqueueSharedPayload({ id: 'second', error: 'invalid' })
    expect(peekSharedPayload()).toMatchObject({ id: 'first', text: game, storageError: true })
    removeSharedPayload()
    expect(peekSharedPayload()).toMatchObject({ id: 'second', error: 'invalid', storageError: true })
    removeSharedPayload()
  } finally {
    if (old) Object.defineProperty(globalThis, 'sessionStorage', old)
    else Reflect.deleteProperty(globalThis, 'sessionStorage')
  }
})
