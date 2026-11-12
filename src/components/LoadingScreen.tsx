'use client';
// Loading screen (spec 021 item 7): real progress bar, the world's dot matrix lighting up with it, rotating messages and a curiosity.
// Reduced motion: no matrix, no rotation, no easing: only the bar and the first message.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CountrySummary } from '../api/types';
import { DOT_SPACING } from '../lib/dotMaterial';
import { LAND_COLS, LAND_ROWS, LAND_STEP } from '../lib/landmask';
import { palette } from '../lib/palette';

const MESSAGE_MS = 2500;
const RENDER_SHARE = 0.3; // the last step (first render) has no real signal: it creeps toward 85% of its share until the frame arrives

// land cells of the baked mask, and an estimate of how many dots the globe draws on land (cells weighted by cos(lat) = their area)
const LAND = (() => {
  const cells: [number, number][] = []; // [col, row]
  let landArea = 0;
  let allArea = 0;
  LAND_ROWS.forEach((hex, r) => {
    const w = Math.cos(((90 - LAND_STEP * (r + 0.5)) * Math.PI) / 180);
    allArea += w * LAND_COLS;
    for (let c = 0; c < LAND_COLS; c++) {
      if ((parseInt(hex[c >> 2]!, 16) >> (3 - (c & 3))) & 1) {
        cells.push([c, r]);
        landArea += w;
      }
    }
  });
  const sphereDeg2 = 41253; // square degrees on a sphere
  return { cells, dots: ((landArea / allArea) * sphereDeg2) / DOT_SPACING ** 2 };
})();
const DOTS_LABEL = `~${Math.round(LAND.dots / 1000)} mil`;
// stable pseudo-random 0..1 per dot: the progress at which it lights up
const threshold = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function curiosities(list: CountrySummary[]): string[] {
  const out: string[] = [];
  const multi = list.filter((c) => (c.capital_coords?.length ?? 0) > 1).length;
  if (multi) out.push(`${multi} países têm mais de uma capital.`);
  const micro = list.filter((c) => c.marker).length;
  if (micro) out.push(`${micro} países são tão pequenos que aparecem como losangos no globo.`);
  const monarchies = list.filter((c) => c.regime?.toLowerCase().includes('monarquia')).length;
  if (monarchies) out.push(`${monarchies} países ainda são monarquias.`);
  const n = new Map<string, number>();
  for (const c of list) if (c.regime) n.set(c.regime, (n.get(c.regime) ?? 0) + 1);
  const top = [...n].sort((a, b) => b[1] - a[1])[0];
  if (top) out.push(`O regime mais comum é “${top[0]}”, com ${top[1]} países.`);
  const longest = [...list].sort((a, b) => b.name.length - a.name.length)[0];
  if (longest) out.push(`O nome mais longo da lista é “${longest.name}”.`);
  return out;
}

interface Props {
  target: number; // 0..1, progress of the measurable steps (map bytes, API list, globe code), as a share of the whole
  rendering: boolean; // all data is in; waiting for the globe's first frame
  done: boolean; // first frame drawn
  countries: CountrySummary[] | null;
}

export function LoadingScreen({ target, rendering, done, countries }: Props) {
  const [gone, setGone] = useState(false);
  const [msg, setMsg] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLElement>(null);
  const pctEl = useRef<HTMLParagraphElement>(null);
  const live = useRef({ target, rendering, done });
  live.current = { target, rendering, done };
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // The displayed value eases toward the goal (and creeps during the first render) so the bar never jumps or stalls. It is written
  // straight to the DOM (no React state per frame): re-rendering at 60 fps starved the globe's own mount.
  useEffect(() => {
    let raf = 0;
    let v = 0;
    let drawn = -1;
    let creep = 0;
    let fading = 0;
    const paint = () => {
      const pct = Math.round(v * 100);
      if (fill.current) fill.current.style.width = `${pct}%`;
      if (pctEl.current) pctEl.current.textContent = `${pct}%`;
      bar.current?.setAttribute('aria-valuenow', String(pct));
      const c = canvas.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx || !c.clientWidth || reduced.current || Math.abs(v - drawn) < 0.004) return;
      drawn = v;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth;
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(c.clientHeight * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, c.clientHeight);
      const cell = w / LAND_COLS;
      LAND.cells.forEach(([col, row], i) => {
        const lit = threshold(i) <= v;
        ctx.globalAlpha = lit ? 1 : 0.28;
        ctx.fillStyle = lit ? palette.ice : palette.iceDim;
        ctx.beginPath();
        ctx.arc((col + 0.5) * cell, (row + 0.5) * cell, cell * 0.34, 0, 6.2832);
        ctx.fill();
      });
    };
    const tick = () => {
      const { target: t, rendering: r, done: d } = live.current;
      if (r && !d) creep += (0.85 - creep) * 0.012;
      const goal = d ? 1 : Math.min(0.99, t + (r ? creep * RENDER_SHARE : 0));
      v = reduced.current ? goal : v + (goal - v) * 0.12;
      if (Math.abs(goal - v) < 0.0005) v = goal;
      paint();
      if (v >= 1) {
        // fade out, then unmount
        root.current?.classList.add('is-done');
        fading = window.setTimeout(() => setGone(true), reduced.current ? 0 : 400);
      } else raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fading);
    };
  }, []);

  const fact = useMemo(() => {
    const facts = countries ? curiosities(countries) : [];
    return facts[Math.floor(Math.random() * facts.length)];
  }, [countries]);
  const messages = useMemo(
    () => [
      'Carregando os mapas dos países',
      countries?.length ? `Carregando ${countries.length} países` : 'Chamando a API do Atlas',
      `Desenhando ${DOTS_LABEL} pontos`,
      'Montando fronteiras e costas',
      'Primeira visita é mais lenta: a API acorda do modo econômico',
    ],
    [countries],
  );
  useEffect(() => {
    if (reduced.current) return;
    const t = setInterval(() => setMsg((m) => (m + 1) % messages.length), MESSAGE_MS);
    return () => clearInterval(t);
  }, [messages.length]);

  if (gone) return null;
  return (
    <div ref={root} className="loading-screen" role="status" aria-live="polite" aria-label="Carregando o Atlas">
      <canvas ref={canvas} className="loading__matrix" aria-hidden="true" />
      <div ref={bar} className="loading__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
        <i ref={fill} />
      </div>
      <p ref={pctEl} className="loading__pct">0%</p>
      <div className="loading__notes">
        <p key={msg} className="loading__msg">{messages[reduced.current ? 0 : msg]}</p>
        {fact && (
          <p className="loading__fact">
            <span>Você sabia?</span> {fact}
          </p>
        )}
      </div>
    </div>
  );
}
