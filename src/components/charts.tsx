// Hand-made SVG charts (spec 009; dataviz skill: thin 2px lines, recessive grid, end labels + legend, crosshair tooltip, surface ring on markers).
// Series colours come from the validated categorical palette in lib/palette.ts, assigned by position (fixed order, never cycled).
import { useEffect, useRef, useState } from 'react';
import { regimePalette } from '../lib/palette';
import type { Series } from '../lib/currency';

export const seriesColor = (i: number) => regimePalette[i % regimePalette.length]!;

/** Width of an element, tracked with ResizeObserver, so the SVG is drawn at real pixel size (text stays readable on phones). */
function useWidth<T extends HTMLElement>(initial = 720) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.round(el.getBoundingClientRect().width) || initial);
    const ro = new ResizeObserver(([e]) => e && setW(Math.round(e.contentRect.width) || initial));
    ro.observe(el);
    return () => ro.disconnect();
  }, [initial]);
  return [ref, w] as const;
}

const dFmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const nice = (lo: number, hi: number, n = 4) => {
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v);
  return out;
};

/** Base-100 line chart over dates: one line per series, dashed reference at 100, crosshair + tooltip on hover/touch. */
export function LineChart({ series, height = 280 }: { series: Series[]; height?: number }) {
  const [wrap, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null); // index into `dates`
  const m = { l: 40, r: 44, t: 12, b: 24 };
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort();
  if (!dates.length) return <p className="nodata">sem dados</p>;
  const t0 = Date.parse(dates[0]!), t1 = Date.parse(dates.at(-1)!);
  const all = series.flatMap((s) => s.points.map((p) => p.v));
  const lo = Math.min(100, ...all), hi = Math.max(100, ...all);
  const pad = (hi - lo) * 0.08 || 5;
  const y0 = lo - pad, y1 = hi + pad;
  const x = (d: string) => m.l + ((Date.parse(d) - t0) / (t1 - t0 || 1)) * (W - m.l - m.r);
  const y = (v: number) => m.t + (1 - (v - y0) / (y1 - y0)) * (height - m.t - m.b);
  const yt = nice(y0, y1);
  const xt = [0, 1, 2, 3].map((k) => new Date(t0 + ((t1 - t0) * k) / 3).toISOString().slice(0, 10));
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = t0 + ((e.clientX - r.left - m.l) / (W - m.l - m.r)) * (t1 - t0);
    let best = 0;
    dates.forEach((d, i) => { if (Math.abs(Date.parse(d) - t) < Math.abs(Date.parse(dates[best]!) - t)) best = i; });
    setHover(best);
  };
  const hd = hover !== null ? dates[hover]! : null;
  const rows = hd ? series.flatMap((s, i) => { const p = s.points.find((q) => q.date === hd); return p ? [{ code: s.code, v: p.v, c: seriesColor(i) }] : []; }) : [];
  const hx = hd ? x(hd) : 0;
  return (
    <div ref={wrap} className="chart" style={{ height }}>
      <svg width={W} height={height} role="img" aria-label="Gráfico de linhas das cotações em base 100" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {yt.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} className="chart__grid" />
            <text x={m.l - 6} y={y(v) + 3.5} textAnchor="end" className="chart__tick">{Math.round(v)}</text>
          </g>
        ))}
        <line x1={m.l} x2={W - m.r} y1={y(100)} y2={y(100)} className="chart__ref" />
        {xt.map((d, k) => <text key={d} x={x(d)} y={height - 6} textAnchor={k === 0 ? 'start' : k === 3 ? 'end' : 'middle'} className="chart__tick">{dFmt(d)}</text>)}
        {series.map((s, i) => {
          const last = s.points.at(-1)!;
          return (
            <g key={s.code}>
              <polyline fill="none" stroke={seriesColor(i)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                points={s.points.map((p) => `${x(p.date).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')} />
              <text x={Math.min(x(last.date) + 6, W - 2)} y={y(last.v) + 3.5} className="chart__end" fill="currentColor">{s.code}</text>
            </g>
          );
        })}
        {hd && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={m.t} y2={height - m.b} className="chart__cross" />
            {rows.map((r) => <circle key={r.code} cx={hx} cy={y(r.v)} r="4" fill={r.c} className="chart__dot" />)}
          </g>
        )}
      </svg>
      {hd && (
        <div className="chart__tip" style={{ left: hx > W / 2 ? undefined : hx + 12, right: hx > W / 2 ? W - hx + 12 : undefined }} role="status">
          <b>{dFmt(hd)}</b>
          {rows.map((r) => <span key={r.code}><i style={{ background: r.c }} />{r.code} <em>{r.v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</em></span>)}
        </div>
      )}
    </div>
  );
}

/** 20-year sparkline: 1.5px line, end dot with a surface ring; the last value is printed beside it by the caller. */
export function Sparkline({ points, label }: { points: { year: number; value: number }[]; label: string }) {
  const W = 96, H = 26;
  if (points.length < 2) return <span className="nodata">sem série</span>;
  const lo = Math.min(...points.map((p) => p.value)), hi = Math.max(...points.map((p) => p.value));
  const x = (yr: number) => 2 + ((yr - points[0]!.year) / (points.at(-1)!.year - points[0]!.year || 1)) * (W - 8);
  const y = (v: number) => 3 + (1 - (v - lo) / (hi - lo || 1)) * (H - 6);
  const last = points.at(-1)!;
  return (
    <svg className="spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: de ${points[0]!.year} a ${last.year}`}>
      <polyline fill="none" stroke="var(--c-ice)" strokeWidth="1.5" strokeLinejoin="round" points={points.map((p) => `${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')} />
      <circle cx={x(last.year)} cy={y(last.value)} r="3" fill="var(--c-ice-bright)" stroke="var(--c-panel-solid)" strokeWidth="2" />
    </svg>
  );
}
