// Spec 022: "Em resumo" at the top of the country panel. The text is a formula over the API's own facts; when `method` names a
// model, that model only reworded it (the API rejects any rewording that adds or changes a number). Any failure hides the block.
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { safeHref } from '../lib/url';

export function BriefSection({ iso2 }: { iso2: string }) {
  const s = useAsync(() => api.brief(iso2), iso2);
  if (s.status !== 'ok') return null;
  const b = s.data;
  const model = b.method.includes('+') ? b.method.split('+')[1] : null;
  return (
    <section className="brief" aria-label="Em resumo">
      <p className="brief__label">Em resumo</p>
      <p className="brief__text">{b.tldr}</p>
      {b.now && <p className="brief__now"><b>Hoje.</b> {b.now}</p>}
      <p className="src">
        Montado pelo Atlas com os dados desta página{model ? `; redação revisada por IA (${model}), sem acrescentar fatos` : ''}.
        {' '}Fontes: {b.sources.map((x, i) => {
          const href = safeHref(x.url);
          return <span key={x.id}>{i > 0 && '; '}{href ? <a href={href} target="_blank" rel="noreferrer noopener">{x.title.split(':')[0]}</a> : x.title.split(':')[0]}</span>;
        })}.
      </p>
    </section>
  );
}
