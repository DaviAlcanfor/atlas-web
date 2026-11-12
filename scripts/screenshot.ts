// Captures the globe at the reference size (screenshot 2: 1061x773) and measures frame rate while dragging.
// Usage: npm run dev (or build + start) in another terminal, then: npm run shot -- <out-dir> [url]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'shots';
const url = process.argv[3] ?? 'http://localhost:5173/';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: !process.env.HEADED, args: process.env.GPU ? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1061, height: 773 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(url);
await page.waitForFunction('!!window.__globe', undefined, { timeout: 60000 }).catch(() => console.log('NO CANVAS; errors:', errors));
await page.waitForTimeout(4000); // triangulation + fonts
await page.screenshot({ path: `${out}/render-view2.png` }); // initial view = reference screenshot 2
await page.evaluate('window.__globe.pointOfView({ lat: 48, lng: 14, altitude: 0.22 }, 0)');
await page.waitForTimeout(4000);
await page.screenshot({ path: `${out}/render-view3.png` });
await page.evaluate('window.__globe.pointOfView({ lat: 35, lng: -15, altitude: 0.92 }, 0)');

// frame rate while dragging
// string (not a function) so tsx's helper injection does not leak into the page
await page.evaluate(`(() => { window.__f = []; let last = performance.now();
  const tick = (t) => { window.__f.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
await page.mouse.move(500, 400);
await page.mouse.down();
for (let i = 0; i < 120; i++) await page.mouse.move(500 + i * 2, 400 + i);
await page.mouse.up();
await page.waitForTimeout(500);
const frames = await page.evaluate<number[]>('window.__f.slice(1)');
const sorted = [...frames].sort((a, b) => a - b);
const avg = sorted[Math.floor(sorted.length / 2)]!;
const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
console.log(`drag frames: ${frames.length}, median ${avg.toFixed(1)} ms (${(1000 / avg).toFixed(0)} fps), p95 ${p95.toFixed(1)} ms`);

// interaction checks: hover Austria, click it, check card text, path (/pais/at) and fly-to
const at = await page.evaluate<{ x: number; y: number }>('window.__globe.getScreenCoords(47.5, 14.1)');
await page.mouse.move(at.x, at.y);
await page.waitForTimeout(800);
console.log('hover card:', JSON.stringify(await page.locator('.info-card').innerText()));
await page.mouse.click(at.x, at.y);
await page.waitForTimeout(2500);
console.log('after click card:', JSON.stringify(await page.locator('.info-card').innerText()), '| path:', await page.evaluate('location.pathname'));
await page.mouse.move(5, 5);
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/render-selected.png` });
// micro-state marker click (Liechtenstein)
await page.getByRole('button', { name: 'Liechtenstein' }).click({ force: true });
await page.waitForTimeout(2500);
console.log('marker click card:', JSON.stringify(await page.locator('.info-card').innerText()), '| path:', await page.evaluate('location.pathname'));
await page.screenshot({ path: `${out}/render-marker.png` });
// 400px width: horizontal scroll?
await page.setViewportSize({ width: 400, height: 800 });
await page.waitForTimeout(1500);
console.log('400px scrollWidth:', await page.evaluate('document.documentElement.scrollWidth'));
await page.screenshot({ path: `${out}/render-400.png` });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
