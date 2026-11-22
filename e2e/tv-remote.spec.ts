import { test, expect } from '@playwright/test'

test.use({ userAgent: 'Mozilla/5.0 SzachyAndroidTV', viewport: { width: 1280, height: 720 } })

test('TV remote changes sections without a pointer', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.locator('html')).toHaveAttribute('data-input', 'tv')
  await expect(page.locator('main h1')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  const focused = page.locator(':focus')
  await expect(focused).toHaveAttribute('href', '#/play')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/play$/)
})

test('TV remote plays a legal move, receives a bot reply and leaves the board', async ({ page }) => {
  await page.goto('/#/play/bot/pip?color=w&tc=none&hints=1&undo=1&eval=0')
  const board = page.locator('[data-chess-board]')
  await expect(page.locator('cg-board')).toBeVisible()
  await board.focus()
  await expect(board).toHaveAccessibleName(/e2/)
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await expect(board).toHaveAccessibleName(/e4/)
  await page.keyboard.press('Enter')
  const moves = page.locator('.tabular button:visible')
  await expect(moves).toHaveCount(2, { timeout: 20_000 })
  await expect(moves.first()).toHaveText('e4')
  await expect(page.locator('.board-keyboard-cursor')).toBeVisible()
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft')
  await expect(board).not.toBeFocused()
  await expect(moves).toHaveCount(2)
})

test('TV board arrows follow the black orientation', async ({ page }) => {
  await page.goto('/#/play/bot/pip?color=b&tc=none&eval=0')
  const moves = page.locator('.tabular button:visible')
  await expect(moves).toHaveCount(1, { timeout: 20_000 })
  const board = page.locator('[data-chess-board]')
  await board.focus()
  await expect(board).toHaveAccessibleName(/e7/)
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await expect(board).toHaveAccessibleName(/e5/)
  await page.keyboard.press('Enter')
  await expect(moves).toHaveCount(3, { timeout: 20_000 })
  await expect(moves.nth(1)).toHaveText('e5')
})

for (const viewport of [{ width: 960, height: 540 }, { width: 1280, height: 720 }]) {
  test(`TV setup moves down from color to Play without entering clipped bots at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/#/play')
    const color = page.getByRole('radiogroup', { name: 'You play' }).getByRole('radio').first()
    await color.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused()
  })
}

test('TV remote selects a bot, scrolls its list and starts a game from setup without a pointer', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/#/play')
  // Reproduce the route focus observed when entering setup from the app navigation.
  await page.getByRole('heading', { name: 'Play', exact: true }).focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'Bots', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  const pip = page.getByRole('button', { name: /Pip/ })
  await expect(pip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(pip).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ArrowDown')
  const focused = page.locator(':focus')
  await expect(focused).toHaveAttribute('aria-pressed', /true|false/)
  expect(await focused.evaluate((element) => {
    const list = element.closest('.overflow-y-auto')!
    const item = element.getBoundingClientRect()
    const bounds = list.getBoundingClientRect()
    return list.scrollTop > 0 && item.top >= bounds.top && item.bottom <= bounds.bottom
  })).toBe(true)
  const play = page.getByRole('button', { name: 'Play', exact: true })
  for (let step = 0; step < 20 && !(await play.evaluate((element) => element === document.activeElement)); step++) {
    await page.keyboard.press('ArrowDown')
  }
  await expect(play).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/play\/bot\/pip\?/)
  await expect(page.locator('[data-chess-board]')).toBeVisible()
})

test('TV game keeps actions beside the board above navigation after a move at device density', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 })
  await page.goto('/#/play/bot/pip?color=w&tc=none&eval=0')
  const board = page.locator('[data-chess-board]')
  await board.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await expect(page.locator('.tabular button:visible')).toHaveCount(2, { timeout: 20_000 })
  const boardBox = (await board.boundingBox())!
  const navigation = (await page.locator('nav:visible').boundingBox())!
  for (const label of ['Hint', 'Undo', 'Offer draw', 'Resign']) {
    const action = page.getByRole('button', { name: label, exact: true })
    await expect(action).toBeVisible()
    const box = (await action.boundingBox())!
    expect(box.x).toBeGreaterThan(boardBox.x + boardBox.width)
    expect(box.y + box.height).toBeLessThan(navigation.y)
  }
  await page.screenshot({ path: 'test-results/chess-tv-960-layout.png' })
})
