import { Info } from '@phosphor-icons/react/dist/csr/Info';
import type { ReactNode } from 'react';
import { useGlossary } from '../glossary';
import { Tooltip } from './Tooltip';

/** Text that has a glossary entry gets an info icon: hover/focus = short tooltip, click = full dialog. No entry = plain text. */
export function Term({ id, label, children }: { id?: string | null; label?: string; children: ReactNode }) {
  const g = useGlossary();
  const t = g.find(id, label);
  if (!t) return <>{children}</>;
  return (
    <Tooltip text={t.short}>
      {(aria) => (
        <button type="button" className="term" {...aria} aria-haspopup="dialog" onClick={() => g.open(t.id)}>
          {children}<Info className="term__i" size={12} weight="light" aria-hidden="true" />
        </button>
      )}
    </Tooltip>
  );
}
