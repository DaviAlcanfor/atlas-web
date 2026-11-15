'use client';
// Spec 008: geopolitical news. `/noticias` = the world feed (filters, "maybe relevant", paging); `CountryNews` = the panel block.
// Titles are plain text in their original language and open the original outlet in a new tab. GDELT must be cited and linked.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { NewsItem, NewsList } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { flagPreviewUrl, safeHref } from '../lib/url';
import { Section } from './Section';

export const EVENT_LABEL: Record<NewsItem['event_type'], string> = {
  conflict: 'conflito', diplomacy: 'diplomacia', election: 'eleição', sanctions: 'sanções', agreement: 'acordo',
  protest: 'protesto', coup: 'golpe', economy_policy: 'política econômica', other: 'outro',
};
const LANG_LABEL: Record<string, string> = { pt: 'PT', en: 'EN', es: 'ES' };
const REGIONS = ['África', 'América do Norte', 'América do Sul', 'Ásia', 'Europa', 'Oceania'];

export function ago(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `há ${h} h` : `há ${Math.round(h / 24)} dias`;
}
const day = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

function Credit() {
  return <p className="src">Manchetes: <a href="https://www.gdeltproject.org/" target="_blank" rel="noreferrer noopener">The GDELT Project</a>. Seleção e classificação automáticas por IA (GPT-6 Luna); confira sempre a fonte original.</p>;
}

function Stale({ fetchedAt }: { fetchedAt: string | null }) {
  if (!fetchedAt || Date.now() - new Date(fetchedAt).getTime() < 24 * 3600e3) return null;
  return <p className="warn">Atualizado {ago(fetchedAt)}: a coleta automática pode estar parada.</p>;
}

export function NewsRow({ n, nameOf }: { n: NewsItem; nameOf: (iso: string) => string }) {
  const href = safeHref(n.url);
  return (
    <li className={`news__item${n.geopolitical_p < 0.7 ? ' news__item--maybe' : ''}`}>
      <div className="news__meta">
        <span className={`news__type news__type--${n.event_type}`}>{EVENT_LABEL[n.event_type]}</span>
        <span>{n.outlet}</span>
        <span>{ago(n.published_at)}</span>
        {n.language && <span className="news__lang">{LANG_LABEL[n.language] ?? n.language.toUpperCase()}</span>}
      </div>
      {href ? <a className="news__title" href={href} target="_blank" rel="noopener noreferrer">{n.title}</a> : <span className="news__title">{n.title}</span>}
      {n.countries.length > 0 && (
        <ul className="news__countries">
          {n.countries.map((c) => {
            const f = flagPreviewUrl(c);
            return <li key={c}><Link href={`/pais/${c.toLowerCase()}`}>{f && <img src={f} alt="" width={18} height={12} />}{nameOf(c)}</Link></li>;
          })}
        </ul>
      )}
    </li>
  );
}

/** The panel block: the country's latest headlines (7 days); empty = link out. */
export function CountryNews({ iso2, name }: { iso2: string; name: string }) {
  const s = useAsync(() => api.countryNews(iso2), iso2);
  const names = useAsync(() => api.countries(), 'all');
  const nameOf = (c: string) => (names.status === 'ok' ? names.data.find((x) => x.iso2 === c)?.name : undefined) ?? c;
  const google = `https://news.google.com/search?q=${encodeURIComponent(name)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  const week = s.status === 'ok' ? s.data.items.filter((n) => Date.now() - new Date(n.published_at).getTime() < 7 * 24 * 3600e3).slice(0, 6) : [];
  return (
    <Section title="Notícias">
      {s.status === 'ok' && week.length > 0 ? (
        <>
          <ul className="news">{week.map((n) => <NewsRow key={n.id} n={n} nameOf={nameOf} />)}</ul>
          <Link className="news-link" href={`/noticias?pais=${iso2}`}>Todas as notícias sobre {name} →</Link>
          <Credit />
        </>
      ) : (
        <>
          {s.status === 'ok' && <p className="note">Sem notícias geopolíticas recentes sobre {name}.</p>}
          <a className="news-link" href={google} target="_blank" rel="noreferrer noopener">Ver notícias sobre {name} no Google Notícias ↗</a>
        </>
      )}
    </Section>
  );
}

/** `/noticias`: world feed grouped by day. Filters live in the URL (shareable). */
export function NewsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const type = (sp.get('tipo') ?? '') as NewsItem['event_type'] | '';
  const lang = sp.get('idioma') ?? '';
  const region = sp.get('regiao') ?? '';
  const country = sp.get('pais')?.toUpperCase() ?? '';
  const maybe = sp.get('talvez') === '1';
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    router.replace(`/noticias${p.size ? `?${p}` : ''}`, { scroll: false });
  };
  const query = useMemo(() => ({ type: type || undefined, lang: lang || undefined, region: region || undefined, country: country || undefined, min_p: maybe ? 0.5 : 0.7 }),
    [type, lang, region, country, maybe]);
  const key = JSON.stringify(query);
  const first = useAsync(() => api.news(query), key);
  const [more, setMore] = useState<NewsList[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => setMore([]), [key]);
  const names = useAsync(() => api.countries(), 'all');
  const nameOf = (c: string) => (names.status === 'ok' ? names.data.find((x) => x.iso2 === c)?.name : undefined) ?? c;
  const pages = first.status === 'ok' ? [first.data, ...more] : [];
  const items = pages.flatMap((p) => p.items);
  const next = pages.at(-1)?.next ?? null;
  const byDay = useMemo(() => {
    const m = new Map<string, NewsItem[]>();
    for (const n of items) m.set(day(n.published_at), [...(m.get(day(n.published_at)) ?? []), n]);
    return [...m];
  }, [items]);
  const loadMore = async () => {
    if (!next) return;
    setLoadingMore(true);
    try { const p = await api.news({ ...query, before: next }); setMore((m) => [...m, p]); } finally { setLoadingMore(false); }
  };

  return (
    <main className="cpage" lang="pt-BR">
      <button className="gpage__back" onClick={() => (history.length > 1 ? router.back() : router.push('/'))}>← Voltar</button>
      <p className="gpage__kind">Notícias <span>geopolítica</span></p>
      <h1>{country ? `Notícias: ${nameOf(country)}` : 'Notícias do mundo'}</h1>
      <p className="note">Conflitos, diplomacia, eleições, sanções e acordos, das últimas semanas. Manchetes no idioma original; atualizado a cada 6 horas.</p>
      <div className="news__filters">
        <label>Tipo<select value={type} onChange={(e) => set('tipo', e.target.value)}>
          <option value="">todos</option>{Object.entries(EVENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Região<select value={region} onChange={(e) => set('regiao', e.target.value)}>
          <option value="">todas</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label>Idioma<select value={lang} onChange={(e) => set('idioma', e.target.value)}>
          <option value="">todos</option><option value="pt">português</option><option value="en">inglês</option><option value="es">espanhol</option></select></label>
        <label className="news__check"><input type="checkbox" checked={maybe} onChange={(e) => set('talvez', e.target.checked ? '1' : '')} /> incluir “talvez relevante”</label>
        {country && <button className="more-btn" onClick={() => set('pais', '')}>tirar o filtro de país</button>}
      </div>
      {first.status === 'error' ? <p className="empty">Não foi possível carregar as notícias: {first.error.message}</p>
        : first.status !== 'ok' ? <p className="loading-text"><span className="spinner" aria-hidden="true" /> Carregando…</p>
        : !items.length ? (
          <p className="empty">Sem notícias recentes com esses filtros. <a href="https://news.google.com/?hl=pt-BR&gl=BR&ceid=BR:pt-419" target="_blank" rel="noreferrer noopener">Google Notícias ↗</a></p>
        ) : (
          <>
            <Stale fetchedAt={first.data.fetched_at} />
            {byDay.map(([d, list]) => (
              <section key={d} className="news__day">
                <h2>{d}</h2>
                <ul className="news">{list.map((n) => <NewsRow key={n.id} n={n} nameOf={nameOf} />)}</ul>
              </section>
            ))}
            {next && <button className="more-btn" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'carregando…' : 'mais notícias'}</button>}
          </>
        )}
      <Credit />
    </main>
  );
}
