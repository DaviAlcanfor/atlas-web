// README screenshots of a running build (default: production). Usage: npm run readme-shots [-- <url>]
// Writes docs/screenshots/*.jpg at 1440x900. Software WebGL (swiftshader): no GPU needed.
import { chromium, type Page } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = (process.argv[2] ?? 'https://atlas-web-ruddy.vercel.app').replace(/\/$/, '');
const out = 'docs/screenshots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const shot = (name: string) => page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 85 });
async function open(path: string, globe = true) {
  await page.goto(base + path);
  if (globe) await page.waitForFunction('!!window.__globe', undefined, { timeout: 120000 });
  await page.waitForTimeout(globe ? 7000 : 2500);
}
const at = (p: Page, lat: number, lng: number) => p.evaluate<{ x: number; y: number }>(`window.__globe.getScreenCoords(${lat}, ${lng})`);

await open('/');
await shot('globe');

await open('/pais/br');
await page.mouse.move(1100, 300); // over the panel: no country hovered
await page.waitForTimeout(800);
await shot('country');

await page.getByRole('button', { name: 'Estados', exact: true }).click();
await page.waitForTimeout(2500);
const sp = await at(page, -22.2, -48.6);
await page.mouse.click(sp.x, sp.y);
await page.waitForTimeout(4000);
await page.mouse.move(1100, 300);
await page.waitForTimeout(800);
await shot('states');

await page.locator('.hsum').scrollIntoViewIfNeeded();
await page.locator('.periods summary').nth(3).click();
await page.locator('.hsum').evaluate((e) => e.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(800);
await shot('history');

await open('/');
await page.getByRole('button', { name: 'Regime político', exact: true }).click();
await page.evaluate('window.__globe.pointOfView({ lat: 20, lng: 15, altitude: 1.6 }, 0)');
await page.waitForTimeout(3000);
await shot('regimes');

await open('/glossario', false);
await shot('glossary');

await open('/moeda/BRL', false);
await shot('currency');

await browser.close();
console.log(`wrote ${out}/*.jpg from ${base}`);
