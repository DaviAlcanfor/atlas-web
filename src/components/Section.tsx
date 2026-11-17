import type { ReactNode } from 'react';
import { Hint } from './Hint';
import { LabelIcon } from './icons';

/** Panel block: icon + small-caps title + hairline. `fold`: the block opens and closes on its title, closed at first. */
export function Section({ title, fold, onOpen, children }: { title: string; fold?: boolean; onOpen?: () => void; children: ReactNode }) {
  if (!fold) {
    return (
      <section className="psec">
        <h3><LabelIcon label={title} />{title}<Hint k={title} /></h3>
        {children}
      </section>
    );
  }
  return (
    <details className="psec psec--fold" onToggle={(e) => { if (e.currentTarget.open) onOpen?.(); }}>
      <summary>
        {/* the (i) inside the title must not open/close the block */}
        <h3><LabelIcon label={title} />{title}<span onClick={(e) => e.preventDefault()}><Hint k={title} /></span></h3>
      </summary>
      {children}
    </details>
  );
}
