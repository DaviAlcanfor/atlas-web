import type { CSSProperties, ReactNode } from 'react';
import { regimePalette } from '../lib/palette';
import { flagPreviewUrl } from '../lib/url';

export interface BlockMeta {
  id: string;
  title: string;
}

/** Spec 026: a full-page section with its number, accent colour (categorical palette; the number and title carry the meaning), blurb. */
export function Block({ n, id, title, blurb, children }: { n: number; id: string; title: string; blurb?: string; children: ReactNode }) {
  return (
    <section className="blk" id={id} style={{ '--accent': regimePalette[(n - 1) % regimePalette.length] } as CSSProperties}>
      <header className="blk__head">
        <span className="blk__n" aria-hidden="true">{String(n).padStart(2, '0')}</span>
        <div>
          <h2>{title}</h2>
          {blurb && <p>{blurb}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

/** Jump links to the blocks of a page, numbered like the blocks. */
export function BlockIndex({ items }: { items: BlockMeta[] }) {
  return (
    <nav className="cindex" aria-label="Seções da página">
      {items.map((b, i) => <a key={b.id} href={`#${b.id}`}><b>{String(i + 1).padStart(2, '0')}</b> {b.title}</a>)}
    </nav>
  );
}

/** Small flag (flagcdn, public domain) + name; no flag for codes that are not ISO 3166-1 alpha-2. */
export function FlagName({ iso, name }: { iso: string; name: string }) {
  const src = flagPreviewUrl(iso);
  return <span className="flagname">{src && <img src={src} alt="" width={22} height={15} loading="lazy" />}{name}</span>;
}
