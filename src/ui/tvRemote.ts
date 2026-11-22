/** The native shell marks TV devices without changing phone or browser input. */
export const isAndroidTv = () => navigator.userAgent.includes('SzachyAndroidTV')

const CONTROLS = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]'

/** Directional focus for WebViews, with component handlers (board/radio) taking priority. */
export function installTvRemote() {
  if (!isAndroidTv()) return
  document.documentElement.dataset.input = 'tv'
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    const active = document.activeElement as HTMLElement | null
    if (active?.matches('input,textarea,select,[contenteditable="true"]')) return
    const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal]')]
    const scope = dialogs.filter((el) => el.getClientRects().length).at(-1) ?? document
    const candidates = [...scope.querySelectorAll<HTMLElement>(CONTROLS)].filter((el) =>
      el !== active && el.tabIndex >= 0 && el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden' && el.getAttribute('aria-disabled') !== 'true')
    if (!candidates.length) return
    const current = active && active !== document.body && scope.contains(active) ? active.getBoundingClientRect() : null
    let next: HTMLElement | undefined
    if (!current) next = candidates[0]
    else {
      const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
      const sign = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
      const x = current.x + current.width / 2, y = current.y + current.height / 2
      let best = Infinity
      for (const candidate of candidates) {
        const rect = candidate.getBoundingClientRect()
        const dx = rect.x + rect.width / 2 - x, dy = rect.y + rect.height / 2 - y
        const along = (horizontal ? dx : dy) * sign
        if (along <= 1) continue
        const cross = horizontal ? Math.abs(dy) : Math.abs(dx)
        const overlap = horizontal ? rect.bottom > current.top && rect.top < current.bottom
          : rect.right > current.left && rect.left < current.right
        const score = along + cross * 3 + (overlap ? 0 : 1000)
        if (score < best) { best = score; next = candidate }
      }
    }
    event.preventDefault()
    if (next) {
      next.focus({ preventScroll: true })
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  })
}
