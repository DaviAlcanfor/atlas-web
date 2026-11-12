import { useEffect, useRef } from 'react';

const DURATION = 700; // ms
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Counts from 0 to `value` once on mount (spec 013: draws the eye to the key figures).
 * Renders the final text first (tests, no-JS, reduced motion) and animates by writing textContent directly,
 * so React never re-renders per frame.
 */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      el.textContent = format(value * easeOut(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); el.textContent = format(value); };
  }, [value, format]);
  return <span ref={ref}>{format(value)}</span>;
}
