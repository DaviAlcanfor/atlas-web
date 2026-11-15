'use client';
// Loading screen (spec 021 item 7, spec 028): covers the whole screen until the globe draws its first frame, so the map and
// its controls cannot be used before the globe exists. Real progress bar, the world's dot matrix lighting up with it, the stages
// that are done, and a curiosity that changes every few seconds. After SLOW_MS (or when the globe fails) it offers a way in without the globe.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CountrySummary } from '../api/types';
import { LAND_COLS, LAND_ROWS } from '../lib/landmask';
import { palette } from '../lib/palette';

const SLOW_MS = 20000;
const FACT_MS = 8000;
const RENDER_SHARE = 0.3; // the last step (first render) has no real signal: it creeps toward 85% of its share until the frame arrives

// land cells of the baked mask, and the land share of the sphere (for the dot count label in the steps)
const LAND = (() => {
  const cells: [number, number][] = []; // [col, row]
  LAND_ROWS.forEach((hex, r) => {
    for (let c = 0; c < LAND_COLS; c++) {
      if ((parseInt(hex[c >> 2]!, 16) >> (3 - (c & 3))) & 1) cells.push([c, r]);
    }
  });
  return { cells };
})();
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

export interface Step { label: string; done: boolean }

interface Props {
  target: number; // 0..1, progress of the measurable steps (map bytes, API list, globe code), as a share of the whole
  rendering: boolean; // all data is in; waiting for the globe's first frame
  done: boolean; // first frame drawn
  countries: CountrySummary[] | null;
  steps: Step[]; // the stages shown as a checklist
  failed?: string; // the 3D globe could not start (no WebGL, error): say so, and offer to continue without it
  onSkip: () => void; // the way into the site without the globe (after SLOW_MS, or when the globe failed)
}

export function LoadingScreen({ target, rendering, done, countries, steps, failed, onSkip }: Props) {
  const [gone, setGone] = useState(false);
  const [fact, setFact] = useState(0);
  const [slow, setSlow] = useState(false);
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
      // once the globe has drawn, finish now: easing per frame would take dozens of frames, i.e. seconds on a slow GPU
      v = reduced.current || d ? goal : v + (goal - v) * 0.12;
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

  // Curiosities change every FACT_MS (the first one is picked once the list arrives; the start index is 0 so server and client agree)
  const facts = useMemo(() => (countries ? curiosities(countries) : []), [countries]);
  useEffect(() => {
    if (reduced.current || facts.length < 2) return;
    const t = setInterval(() => setFact((f) => (f + 1) % facts.length), FACT_MS);
    return () => clearInterval(t);
  }, [facts.length]);
  const shownFact = facts.length ? facts[fact % facts.length] : undefined;

  // Spec 028: after SLOW_MS without the first frame, the screen offers the way in without the globe.
  useEffect(() => { const t = setTimeout(() => setSlow(true), SLOW_MS); return () => clearTimeout(t); }, []);
  if (gone) return null;
  const offer = !!failed || slow;
  return (
    <div ref={root} className="loading-screen" role="status" aria-live="polite" aria-label="Carregando o Atlas">
      <div className="loading__stage">
        <p className="loading__brand">Atlas</p>
        <canvas ref={canvas} className="loading__matrix" aria-hidden="true" />
        <div ref={bar} className="loading__bar" role="progressbar" aria-label="Progresso do carregamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
          <i ref={fill} />
        </div>
        <p ref={pctEl} className="loading__pct">0%</p>
        <ul className="loading__steps">
          {steps.map((s) => (
            <li key={s.label} data-done={s.done}>{s.label}</li>
          ))}
        </ul>
        {failed && <p className="loading__msg">{failed}</p>}
        {!failed && slow && <p className="loading__msg">Está demorando neste computador. Você pode esperar ou entrar sem o globo.</p>}
        {offer && (
          <button type="button" className="loading__skip" onClick={onSkip}>
            {failed ? 'Continuar sem o globo' : 'Entrar sem o globo'}
          </button>
        )}
        {shownFact && (
          <p key={fact} className="loading__fact">
            <span>Você sabia?</span> {shownFact}
          </p>
        )}
      </div>
      <p className="loading__note">A primeira visita pode demorar: a API estava em modo econômico.</p>
    </div>
  );
}
