import { test, expect } from '@playwright/test'

test('home prioritizes import and provides accessible navigation @mobile', async ({ page }, testInfo) => {
  await page.goto('/#/')
  const hero = page.locator('[data-testid="home-hero"]')
  await expect(hero).toBeVisible()
  await expect(hero).toHaveAttribute('href', '#/import')
  await expect(page.locator('cg-board').first()).toBeVisible()
  const nav = page.getByRole('navigation').filter({ visible: true })
  const controls = nav.locator('a:visible, button:visible')
  for (const control of await controls.all()) {
    const box = await control.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  }
  await page.keyboard.press('Tab')
  const focused = page.locator(':focus-visible')
  await expect(focused).toBeVisible()
  expect(await focused.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
  const more = nav.locator('button[aria-controls="more-menu"]')
  if (await more.isVisible()) {
    await more.click()
    await expect(more).toHaveAttribute('data-active', 'true')
    await more.click()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true })
})

test('theme tokens keep text and controls readable @mobile', async ({ page }) => {
  await page.goto('/#/')
  for (const theme of ['dark', 'light']) for (const contrast of ['normal', 'high']) {
    const pairs = await page.evaluate(({ theme, contrast }) => {
      const root = document.documentElement
      root.dataset.theme = theme
      root.dataset.contrast = contrast
      const style = getComputedStyle(root)
      const lum = (name: string) => {
        let hex = style.getPropertyValue(name).trim().slice(1)
        if (hex.length === 3) hex = [...hex].map(c => c + c).join('')
        return [0, 2, 4].map(n => parseInt(hex.slice(n, n + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
      }
      const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((u, v) => v - u); return (x + .05) / (y + .05) }
      return [['text/panel', ratio('--text', '--panel')], ['secondary/panel', ratio('--text-2', '--panel')], ['muted/panel', ratio('--text-3', '--panel')], ['accent/panel', ratio('--accent', '--panel')], ['button', ratio('--on-accent', '--accent')]] as const
    }, { theme, contrast })
    for (const [name, value] of pairs) expect(value, `${theme} ${contrast} ${name}`).toBeGreaterThanOrEqual(4.5)
  }
})

test('capture mobile and desktop light and dark home @mobile', async ({ page }, testInfo) => {
  for (const [width, height] of [[360, 640], [1280, 860]]) for (const theme of ['dark', 'light']) {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ colorScheme: theme as 'dark' | 'light' })
    await page.goto('/#/')
    await expect(page.locator('cg-board').first()).toBeVisible()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`home-${width}-${theme}.png`) })
  }
})
