/** The native shell marks TV devices without changing phone or browser input. */
export const isAndroidTv = () => navigator.userAgent.includes('SzachyAndroidTV')

const CONTROLS = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]'

/** Enter only visible portions of another scroll area; an existing list focus can scroll onward. */
function reachableThroughClipping(target: HTMLElement, source: HTMLElement | null, horizontal: boolean) {
  const rect = target.getBoundingClientRect()
  let x = rect.x + rect.width / 2, y = rect.y + rect.height / 2
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent)
    const bounds = parent.getBoundingClientRect()
    const left = bounds.left + parent.clientLeft, top = bounds.top + parent.clientTop
    const right = left + parent.clientWidth, bottom = top + parent.clientHeight
    const inside = source !== null && parent.contains(source)
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX) && (x < left || x > right)) {
      if (!horizontal || !inside || !/(auto|scroll)/.test(style.overflowX) || parent.scrollWidth <= parent.clientWidth) return false
      x = Math.max(left, Math.min(right, x))
    }
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY) && (y < top || y > bottom)) {
      if (horizontal || !inside || !/(auto|scroll)/.test(style.overflowY) || parent.scrollHeight <= parent.clientHeight) return false
      y = Math.max(top, Math.min(bottom, y))
    }
  }
  return true
}


/** Keep movement within the current scrolling list until there is no item in that direction. */
function scrollArea(source: HTMLElement | null, horizontal: boolean) {
  for (let parent = source?.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent)
    const overflow = horizontal ? style.overflowX : style.overflowY
    if (/(auto|scroll)/.test(overflow) &&
      (horizontal ? parent.scrollWidth > parent.clientWidth : parent.scrollHeight > parent.clientHeight)) return parent
  }
  return undefined
}

/** Directional focus for WebViews, with component handlers (board/radio) taking priority. */
export function installTvRemote() {
  if (!isAndroidTv()) return
  document.documentElement.dataset.input = 'tv'
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    const active = document.activeElement as HTMLElement | null
    if (active?.matches('input,textarea,select,[contenteditable="true"]')) return
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
    const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal]')]
    const scope = dialogs.filter((el) => el.getClientRects().length).at(-1) ?? document
    const candidates = [...scope.querySelectorAll<HTMLElement>(CONTROLS)].filter((el) =>
      el !== active && !el.matches(':disabled') && el.tabIndex >= 0 && el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden' && el.getAttribute('aria-disabled') !== 'true' &&
      reachableThroughClipping(el, active, horizontal))
    if (!candidates.length) return
    const current = active && active !== document.body && scope.contains(active) ? active.getBoundingClientRect() : null
    let next: HTMLElement | undefined
    if (!current) next = candidates[0]
    else {
      const sign = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
      const x = current.x + current.width / 2, y = current.y + current.height / 2
      const area = scrollArea(active, horizontal)
      const pools = area ? [candidates.filter((candidate) => area.contains(candidate)), candidates] : [candidates]
      for (const pool of pools) {
        let best = Infinity
        for (const candidate of pool) {
          const rect = candidate.getBoundingClientRect()
          const dx = rect.x + rect.width / 2 - x, dy = rect.y + rect.height / 2 - y
          const along = (horizontal ? dx : dy) * sign
          if (along <= 1) continue
          const cross = horizontal ? Math.max(0, current.top - rect.bottom, rect.top - current.bottom)
            : Math.max(0, current.left - rect.right, rect.left - current.right)
          const score = along + cross * 3 + (cross === 0 ? 0 : 1000)
          if (score < best) { best = score; next = candidate }
        }
        if (next) break
      }
    }
    event.preventDefault()
    if (next) {
      next.focus({ preventScroll: true })
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  })
}
