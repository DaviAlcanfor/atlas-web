'use client';
// Spec 026: the economy section reachable without clicking a currency. `/economia` = the world (search every country, main
// currencies, compare); `/economia/[iso2]` = one country's analysis. Both reuse the blocks of the currency page.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { flagPreviewUrl } from '../lib/url';
import { Block, BlockIndex, FlagName } from './Block';
import { Compare, Economy } from './CurrencyPage';

const MAIN_CURRENCIES: [string, string][] = [
  ['USD', 'Dólar americano'], ['EUR', 'Euro'], ['JPY', 'Iene'], ['GBP', 'Libra esterlina'], ['CNY', 'Yuan'],
  ['BRL', 'Real'], ['CHF', 'Franco suíço'], ['CAD', 'Dólar canadense'], ['AUD', 'Dólar australiano'], ['INR', 'Rupia indiana'],
];
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function useNames() {
  const s = useAsync(() => api.countries(), 'all');
  const list = useMemo(() => (s.status === 'ok' ? s.data : []), [s]);
  const nameOf = (iso: string) => list.find((c) => c.iso2 === iso)?.name ?? iso;
  return { list, nameOf, loaded: s.status === 'ok', failed: s.status === 'error' };
}

function Back() {
  const router = useRouter();
  return <button className="gpage__back" onClick={() => (history.length > 1 ? router.back() : router.push('/'))}>← Voltar</button>;
}

const HUB_BLOCKS = [{ id: 'paises', title: 'Países' }, { id: 'moedas', title: 'Moedas' }, { id: 'comparar', title: 'Comparar' }];

export function EconomyHub() {
  const { list, nameOf, loaded, failed } = useNames();
  const [q, setQ] = useState('');
  const [self, setSelf] = useState('BR');
  const [cmp, setCmp] = useState(['US', 'CN']);
  const byRegion = useMemo(() => {
    const hits = list.filter((c) => !q.trim() || norm(c.name).includes(norm(q.trim())));
    const groups = new Map<string, typeof hits>();
    for (const c of hits) groups.set(c.region ?? 'Sem região', [...(groups.get(c.region ?? 'Sem região') ?? []), c]);
    return [...groups].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([r, cs]) => [r, cs.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))] as const);
  }, [list, q]);

  return (
    <main className="cpage" lang="pt-BR">
      <Back />
      <p className="gpage__kind">Economia <span>mundo</span></p>
      <h1>Economia do mundo</h1>
      <p className="note">Escolha um país para ver PIB, preços, emprego, dívida e desigualdade; compare países ou entre pela moeda. Dados do Banco Mundial.</p>
      <BlockIndex items={HUB_BLOCKS} />

      <Block n={1} id="paises" title="Países" blurb="Todos os países que o Atlas conhece. Cada um abre a análise econômica dele.">
        <label className="hub-search">Buscar país<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Brasil, Japão…" /></label>
        {failed && <p className="nodata">sem dados: a API não respondeu</p>}
        {!loaded && !failed && <p className="loading-text"><span className="spinner" aria-hidden="true" /> Carregando…</p>}
        {loaded && !byRegion.length && <p className="nodata">nenhum país com esse nome</p>}
        {byRegion.map(([region, cs]) => (
          <div key={region}>
            <h3 className="hub-region">{region} <span>{cs.length}</span></h3>
            <ul className="hub-grid">
              {cs.map((c) => {
                const flag = flagPreviewUrl(c.iso2);
                return <li key={c.iso2}><Link href={`/economia/${c.iso2.toLowerCase()}`}>{flag && <img src={flag} alt="" width={26} height={18} loading="lazy" />}{c.name}</Link></li>;
              })}
            </ul>
          </div>
        ))}
      </Block>

      <Block n={2} id="moedas" title="Moedas principais" blurb="Câmbio, conversor e estado de cada moeda.">
        <ul className="chips">
          {MAIN_CURRENCIES.map(([code, name]) => <li key={code}><Link href={`/moeda/${code.toLowerCase()}`}><b>{code}</b> {name}</Link></li>)}
        </ul>
      </Block>

      <Compare n={3} self={self} cmp={cmp} setCmp={setCmp} names={list} nameOf={nameOf} />
      <label className="hub-search">País principal da comparação
        <select value={self} onChange={(e) => { setSelf(e.target.value); setCmp((c) => c.filter((x) => x !== e.target.value)); }}>
          {[...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((c) => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}
        </select>
      </label>
    </main>
  );
}

const COUNTRY_BLOCKS = [{ id: 'economia', title: 'Economia' }, { id: 'comparar', title: 'Comparar' }, { id: 'moedas', title: 'Moeda' }];

export function EconomyCountry({ iso2 }: { iso2: string }) {
  const { list, nameOf, loaded } = useNames();
  const country = useAsync(() => api.country(iso2), iso2);
  const [cmp, setCmp] = useState<string[]>([]);
  const name = country.status === 'ok' ? country.data.name : loaded ? nameOf(iso2) : iso2;
  const currencies = country.status === 'ok' ? country.data.currencies : [];
  const unknown = loaded && !list.some((c) => c.iso2 === iso2);

  return (
    <main className="cpage" lang="pt-BR">
      <Back />
      <p className="gpage__kind">Economia <span>{iso2}</span></p>
      <h1><FlagName iso={iso2} name={name} /></h1>
      <p className="note">
        <Link href={`/pais/${iso2.toLowerCase()}`}>Painel do país no globo</Link> · <Link href="/economia">Economia do mundo</Link>
      </p>
      {unknown ? <p className="empty">Não há dados para o país {iso2}.</p> : (
        <>
          <BlockIndex items={currencies.length ? COUNTRY_BLOCKS : COUNTRY_BLOCKS.slice(0, 2)} />
          <Economy n={1} countries={[iso2]} nameOf={nameOf} />
          <Compare n={2} self={iso2} cmp={cmp} setCmp={setCmp} names={list} nameOf={nameOf} />
          {currencies.length > 0 && (
            <Block n={3} id="moedas" title="Moeda" blurb="Cotação contra outras moedas, conversor e estado da moeda.">
              <ul className="chips">
                {currencies.map((c) => <li key={c.code}><Link href={`/moeda/${c.code.toLowerCase()}?pais=${iso2}`}><b>{c.code}</b> {c.name}</Link></li>)}
              </ul>
            </Block>
          )}
        </>
      )}
    </main>
  );
}
