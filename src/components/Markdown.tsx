import type { ReactNode } from 'react';

// spec 025: the chat answer's markdown, as React elements (never dangerouslySetInnerHTML). Only what the model is asked to use:
// paragraphs, **bold**, lists ("- ", "1. "), [links](url), tables ("| a | b |" rows; "|---:|" sets right alignment). Headings render as bold paragraphs; anything else stays plain text.
// Internal links (/pais/br) go through `onLink` (router navigation); external http(s) links open in a new tab; other schemes = text.

const LIST = /^\s*(?:[-*•]|(\d+)[.)])\s+/;
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string, onLink: (href: string) => void, key = ''): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}${m.index}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{inline(m[1], onLink, `${k}.`)}</strong>);
    else {
      const [label, href] = [m[2]!, m[3]!];
      if (/^\/(?!\/)/.test(href)) {
        out.push(<a key={k} href={href} onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return; // new tab / window: let the browser do it
          e.preventDefault();
          onLink(href);
        }}>{label}</a>);
      } else if (/^https?:\/\//i.test(href)) {
        out.push(<a key={k} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
      } else out.push(label);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, onLink }: { text: string; onLink: (href: string) => void }) {
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[][] = [];
  let align: ('left' | 'right' | 'center')[] = [];
  const flush = () => {
    const k = blocks.length;
    if (table.length) {
      const [head, ...rows] = table;
      const cell = (c: string, i: number, H: 'th' | 'td') => <H key={i} style={{ textAlign: align[i] ?? 'left' }}>{inline(c, onLink, `${k}.${i}:`)}</H>;
      blocks.push(<div key={k} className="md-table"><table><thead><tr>{head!.map((c, i) => cell(c, i, 'th'))}</tr></thead>
        <tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, i) => cell(c, i, 'td'))}</tr>)}</tbody></table></div>);
    } else if (para.length) blocks.push(<p key={k}>{inline(para.join(' '), onLink)}</p>);
    else if (list) {
      const items = list.items.map((it, i) => <li key={i}>{inline(it, onLink, `${i}:`)}</li>);
      blocks.push(list.ordered ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>);
    }
    para = [];
    list = null;
    table = [];
    align = [];
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const m = LIST.exec(raw);
    const cells = /^\|.*\|$/.test(line) ? line.slice(1, -1).split('|').map((c) => c.trim()) : null;
    if (cells && cells.every((c) => /^:?-{3,}:?$/.test(c))) { // the |---|---:| line under the header
      align = cells.map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left'));
      continue;
    }
    if (cells) {
      if (!table.length) flush();
      table.push(cells);
      continue;
    }
    if (table.length) flush();
    if (!line) flush();
    else if (m) {
      if (para.length || (list && list.ordered !== !!m[1])) flush();
      list ??= { ordered: !!m[1], items: [] };
      list.items.push(raw.slice(m[0].length).trim());
    } else if (/^#{1,6}\s/.test(line)) {
      flush();
      para = [`**${line.replace(/^#+\s+/, '')}**`];
      flush();
    } else {
      if (list) flush();
      para.push(line);
    }
  }
  flush();
  return <>{blocks}</>;
}
