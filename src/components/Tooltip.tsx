import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Hover + keyboard-focus tooltip (spec 004). The trigger is a render prop so the caller's own focusable element
 * receives `aria-describedby`. The bubble is portaled to <body> with fixed coordinates: the panel clips overflow and its
 * backdrop-filter would otherwise trap `position: fixed`. Shown above the trigger, flips below when there is no room.
 * Esc closes it. Reused by specs 009/017.
 */
export function Tooltip({ text, children }: { text: string; children: (aria: { 'aria-describedby': string }) => ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchor.current || !bubble.current) return setPos(null);
    const a = anchor.current.getBoundingClientRect();
    const b = bubble.current.getBoundingClientRect();
    const above = a.top - b.height - 8;
    setPos({ top: above >= 4 ? above : a.bottom + 8, left: Math.max(8, Math.min(a.left, innerWidth - b.width - 8)) });
  }, [open, text]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span ref={anchor} className="tip-anchor" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children({ 'aria-describedby': id })}
      {createPortal(
        <span ref={bubble} id={id} role="tooltip" className={`tip${open && pos ? ' is-open' : ''}`} style={pos ?? undefined}>{text}</span>,
        document.body,
      )}
    </span>
  );
}
