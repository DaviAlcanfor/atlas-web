import { palette } from './palette';

// Procedural starfield: no image files. Seeded so it doesn't flicker on resize.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawStars(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  const rand = mulberry32(42);
  ctx.fillStyle = palette.text;
  const n = Math.round((w * h) / 4200);
  for (let i = 0; i < n; i++) {
    const r = 0.3 + rand() * 0.6;
    ctx.globalAlpha = 0.06 + rand() * 0.3; // subtle: the globe is the subject
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
