import type { ReactNode } from 'react';
import { Hint } from './Hint';
import { LabelIcon } from './icons';

/** Panel block: icon + small-caps title + hairline. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="psec">
      <h3><LabelIcon label={title} />{title}<Hint k={title} /></h3>
      {children}
    </section>
  );
}
