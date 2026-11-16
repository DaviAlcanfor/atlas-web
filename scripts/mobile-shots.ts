// Mobile screenshots (390x844, touch) of the main states. Usage: dev server running, then: npx tsx scripts/mobile-shots.ts <out-dir> [base-url]
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'shots-mobile';
const base = process.argv[3] ?? 'http://localhost:5173';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ ...devices['iPhone 13'] });
page.setDefaultNavigationTimeout(120000);
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e)));

const ready = () => page.waitForFunction('!!window.__globe', undefined, { timeout: 90000 }).then(() => page.waitForTimeout(5000));
await page.goto(base + '/');
await ready();
await page.screenshot({ path: `${out}/1-home.png` });
const menu = page.locator('.layer-toggle__menu');
if (await menu.isVisible()) {
  await menu.tap();
  await page.screenshot({ path: `${out}/1b-menu.png` });
  await page.getByRole('button', { name: 'Ranking' }).tap();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${out}/1c-ranking.png` });
  await menu.tap();
  await page.getByRole('button', { name: 'Padrão' }).tap();
}
await page.goto(base + '/pais/br');
await ready();
await page.screenshot({ path: `${out}/2-country.png` });
const grow = page.locator('.panel__grow');
if (await grow.isVisible()) {
  await grow.tap();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/4-country-full.png` });
}
console.log('scrollWidth:', await page.evaluate('document.documentElement.scrollWidth'), 'errors:', errors.length ? errors : 'none');
await browser.close();
