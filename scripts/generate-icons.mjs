// Rebuild the original icon assets with the locally installed Playwright Chromium.
import { chromium } from '@playwright/test'
import { readFile, writeFile, readdir } from 'node:fs/promises'
const svg = await readFile('public/icon.svg', 'utf8')
const foreground = svg.replace(/  <rect[^\n]+\n/, '')
const square = svg.replace(' rx="108"', '')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ deviceScaleFactor: 1 })
async function render(path, size, source = square, transparent = false) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{width:100%;height:100%;display:block}</style>${source}`)
  await page.screenshot({ path, omitBackground: transparent })
}
for (const size of [192, 512]) await render(`public/icon-${size}.png`, size)
await writeFile('public/icon-maskable.svg', square)
await render('public/icon-maskable-512.png', 512)
await render('resources/icon-only.png', 512)
await render('resources/icon-foreground.png', 512, foreground, true)
await render('resources/splash.png', 512)
for (const locale of ['en-US', 'es-ES', 'pl-PL']) await render(`fastlane/metadata/android/${locale}/images/icon.png`, 512)
const sizes = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
for (const [density, size] of Object.entries(sizes)) {
  const dir = `android/app/src/main/res/mipmap-${density}`
  await render(`${dir}/ic_launcher.png`, size)
  await render(`${dir}/ic_launcher_round.png`, size)
  await render(`${dir}/ic_launcher_foreground.png`, size, foreground, true)
}
// Retain existing Android splash dimensions while replacing the old artwork.
for (const dir of (await readdir('android/app/src/main/res')).filter(d => d === 'drawable' || d.startsWith('drawable-port-') || d.startsWith('drawable-land-'))) {
  const path = `android/app/src/main/res/${dir}/splash.png`
  try {
    const png = await readFile(path)
    const size = png.readUInt32BE(16)
    if (size) await render(path, size)
  } catch { /* drawable directories need not contain a splash */ }
}
await browser.close()
