import { chromium } from 'playwright';
const [base, out] = [process.argv[2]!, process.argv[3]!];
const b = await chromium.launch({ headless: false, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto(base + '/pais/br', { timeout: 120000 });
await p.waitForFunction('!!window.__globe', undefined, { timeout: 120000 });
await p.waitForTimeout(8000);
// idle: how many frames the page paints in 3 s without touching anything (rAF count = main-thread busy-ness proxy)
const idle = await p.evaluate(`new Promise(r => { let n = 0, t0 = performance.now(), last = t0, worst = 0; const f = (t) => { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < 3000) requestAnimationFrame(f); else r({ n, worst: Math.round(worst) }); }; requestAnimationFrame(f); })`);
await p.screenshot({ path: out });
await p.evaluate(`(() => { window.__f = []; let last = performance.now(); const tick = (t) => { window.__f.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
await p.mouse.move(300, 400); await p.mouse.down();
for (let i = 0; i < 80; i++) await p.mouse.move(300 + i * 2, 400 + i);
await p.mouse.up();
const fr = (await p.evaluate<number[]>('window.__f.slice(1)')).sort((a, c) => a - c);
console.log(base, 'idle', JSON.stringify(idle), 'drag median', fr[Math.floor(fr.length / 2)]!.toFixed(0), 'ms p95', fr[Math.floor(fr.length * 0.95)]!.toFixed(0), 'ms');
await b.close();
