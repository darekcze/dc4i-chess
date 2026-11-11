import { beforeEach, describe, expect, it, vi } from 'vitest'

const search = vi.hoisted(() => vi.fn())
vi.mock('../../engine/engine', () => ({ sharedEngine: () => ({ search }) }))
import { isGoodAlternative } from './mistakes'

const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const result = (score: { cp?: number; mate?: number }) => ({ depth: 12, lines: [{ score }] })
describe('engine alternative decision', () => {
  beforeEach(() => search.mockReset())
  it('checks the best move before accepting a high centipawn alternative', async () => {
    search.mockResolvedValueOnce(result({ cp: 450 })).mockResolvedValueOnce(result({ mate: 3 }))
    expect(await isGoodAlternative(start, 'e2e4', 'd2d4')).toBe(false)
    expect(search).toHaveBeenCalledTimes(2)
  })
  it('accepts a high centipawn alternative when the best has no forced mate', async () => {
    search.mockResolvedValueOnce(result({ cp: 450 })).mockResolvedValueOnce(result({ cp: 900 }))
    expect(await isGoodAlternative(start, 'e2e4', 'd2d4')).toBe(true)
  })
  it('does not accept a cut-short search', async () => {
    search.mockResolvedValueOnce({ depth: 3, lines: [{ score: { cp: 450 } }] })
    expect(await isGoodAlternative(start, 'e2e4', 'd2d4')).toBe(false)
    expect(search).toHaveBeenCalledTimes(1)
  })
})
