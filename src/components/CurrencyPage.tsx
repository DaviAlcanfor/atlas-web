'use client';
// Spec 009: full-page currency screen (route /moeda/[code]). The summary comes from the server (`initial`); history, economy and
// comparison are fetched in the browser. Every failure degrades to "sem dados" (production may still serve contract v1.1).
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react/dist/csr/ArrowsLeftRight';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { api } from '../api';
import type { CurrencyDetail, CurrencyHistory } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import {
  apiFrom, convert, defaultVs, fmtEconomy, fmtRate, isWeekly, MAX_COMPARE, MAX_VS, normalizeBase100, parseCmp, parseVs, plainPct, rateOf, seriesChange, signedPct,
} from '../lib/currency';
import { INDICATOR_EXPLANATIONS } from '../lib/explanations';
import { day, safeHref } from '../lib/url';
import { Hint } from './Hint';
import { LineChart, seriesColor, Sparkline } from './charts';

type Range = '1a' | '5a' | 'max';
const RANGES: [Range, string][] = [['1a', '1 ano'], ['5a', '5 anos'], ['max', 'máx.']];
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const shortSrc = (t: string) => t.split(' (')[0]!.split(':')[0]!.trim();
const noData = <span className="nodata">sem dados</span>;

export function CurrencyRoute({ code, initial }: { code: string; initial: CurrencyDetail | null | undefined }) {
  const router = useRouter();
  const sp = useSearchParams();
  const fetched = useAsync(() => api.currency(code), initial === undefined ? code : null);
  const cur = initial ?? (fetched.status === 'ok' ? fetched.data : null);
  const loading = initial === undefined && fetched.status !== 'ok' && fetched.status !== 'error';
  const back = () => (history.length > 1 ? router.back() : router.push('/'));

  return (
    <main className="cpage" lang="pt-BR">
      <button className="gpage__back" onClick={back}>← Voltar</button>
      {loading ? <p className="loading-text"><span className="spinner" aria-hidden="true" /> Carregando…</p>
        : !cur ? <p className="empty">Não há dados para a moeda {code}. {initial === null ? 'Nenhum país a usa, segundo a API.' : 'A API não respondeu.'}</p>
        : <Body cur={cur} initialVs={sp.get('vs')} initialCmp={sp.get('cmp')} />}
    </main>
  );
}

function Body({ cur, initialVs, initialCmp }: { cur: CurrencyDetail; initialVs: string | null; initialCmp: string | null }) {
  const router = useRouter();
  const base = cur.code;
  const [vs, setVs] = useState(() => { const l = parseVs(initialVs, base); return l.length ? l : defaultVs(base); });
  const [cmp, setCmp] = useState(() => parseCmp(initialCmp, cur.countries[0]));
  const [range, setRange] = useState<Range>('1a');
  const names = useAsync(() => api.countries(), 'all');
  const nameOf = (iso: string) => (names.status === 'ok' ? names.data.find((c) => c.iso2 === iso)?.name : undefined) ?? iso;

  // Shareable link: the URL always mirrors the choices (no navigation, just the address bar).
  useEffect(() => {
    const p = new URLSearchParams();
    p.set('vs', vs.join(','));
    if (cmp.length) p.set('cmp', cmp.join(','));
    window.history.replaceState(null, '', `${location.pathname}?${p}`);
  }, [vs, cmp]);

  const rates = cur.rates;
  const known = useMemo(() => new Set(rates?.items.map((i) => i.code)), [rates]);
  const symbol = cur.symbol ? ` (${cur.symbol})` : '';
  const anchor = cur.countries[0];

  return (
    <>
      <p className="gpage__kind">Moeda <span>{base}</span></p>
      <h1>{cur.name}{symbol}</h1>
      <p className="note">Usada em {cur.countries.length ? cur.countries.map(nameOf).join(', ') : 'nenhum país listado'}.</p>
      <p className="warn">Cotação de referência: não é o preço de uma casa de câmbio, de cartão ou de banco.</p>

      <Exchange cur={cur} vs={vs} setVs={setVs} known={known} range={range} setRange={setRange} onBase={(c) => router.push(`/moeda/${c.toLowerCase()}?vs=${vs.filter((v) => v !== c).join(',')}`)} />
      <State cur={cur} anchor={anchor} />
      {anchor && <Economy countries={cur.countries} nameOf={nameOf} />}
      {anchor && <Compare self={anchor} cmp={cmp} setCmp={setCmp} names={names.status === 'ok' ? names.data : []} nameOf={nameOf} />}

      <section className="psec">
        <h3>Países que usam {base}</h3>
        {cur.countries.length ? (
          <ul className="chips">{cur.countries.map((c) => <li key={c}><Link href={`/pais/${c.toLowerCase()}`}>{nameOf(c)}</Link></li>)}</ul>
        ) : noData}
      </section>
      <section className="psec">
        <h3>Fontes</h3>
        <ul className="sources">
          {cur.sources.map((s) => {
            const href = safeHref(s.url);
            return <li key={s.id}>{href ? <a href={href} target="_blank" rel="noreferrer noopener">{s.title}</a> : s.title} · licença: {s.license ?? 'sem dados'}{s.retrieved_at && ` · obtido em ${day(s.retrieved_at)}`}</li>;
          })}
        </ul>
        <p className="src">Cotações do Banco Central Europeu (dias úteis) e, para as moedas que ele não cobre, de uma fonte secundária com dados semanais. Cruzamentos e estatísticas são calculados pelo Atlas. Sem dado = &quot;sem dados&quot;: nada é interpolado.</p>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Câmbio
function Exchange({ cur, vs, setVs, known, range, setRange, onBase }: {
  cur: CurrencyDetail; vs: string[]; setVs: (v: string[]) => void; known: Set<string>; range: Range; setRange: (r: Range) => void; onBase: (c: string) => void;
}) {
  const base = cur.code;
  const to = cur.rates?.date;
  const from = to ? apiFrom(to, range) : undefined;
  const key = to ? `${base}|${vs.join(',')}|${range}` : null;
  const h = useAsync(() => api.currencyHistory(base, vs, from, to), vs.length ? key : null);
  const hist: CurrencyHistory | null = h.status === 'ok' ? h.data : null;
  const series = hist ? normalizeBase100(hist.items, hist.vs, null) : [];
  const weekly = hist ? isWeekly(hist.items) : false;
  const secondary = hist?.source.id === 'exchange-api';
  const [draft, setDraft] = useState('');
  const [baseDraft, setBaseDraft] = useState('');
  const add = () => {
    const c = draft.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(c) && c !== base && !vs.includes(c) && vs.length < MAX_VS) setVs([...vs, c]);
    setDraft('');
  };
  const codes = [...known].sort();

  return (
    <section className="psec">
      <h3>Câmbio</h3>
      <div className="cx__chips">
        <span className="cx__base" title="Moeda base">1 {base} =</span>
        {vs.map((c, i) => {
          const r = rateOf(cur.rates, c);
          return (
            <span key={c} className="cx__chip" style={{ borderColor: seriesColor(i) }}>
              <i style={{ background: seriesColor(i) }} />
              <b>{c}</b> {r !== null ? fmtRate(r) : 'sem dados'}
              <button onClick={() => setVs(vs.filter((v) => v !== c))} aria-label={`Remover ${c}`}><X size={11} aria-hidden="true" /></button>
            </span>
          );
        })}
      </div>
      <div className="cx__ctl">
        <label>Adicionar moeda ({vs.length}/{MAX_VS})
          <input list="cx-codes" value={draft} maxLength={3} placeholder="JPY" disabled={vs.length >= MAX_VS}
            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} onBlur={add} />
        </label>
        <label>Trocar a base
          <input list="cx-codes" value={baseDraft} maxLength={3} placeholder={base}
            onChange={(e) => setBaseDraft(e.target.value)}
            onKeyDown={(e) => { const c = baseDraft.trim().toUpperCase(); if (e.key === 'Enter' && /^[A-Z]{3}$/.test(c) && c !== base) onBase(c); }} />
        </label>
        <datalist id="cx-codes">{codes.map((c) => <option key={c} value={c} />)}</datalist>
      </div>

      <Converter base={base} vs={vs} rates={cur.rates} />

      <div className="filters" role="group" aria-label="Período do gráfico">
        {RANGES.map(([r, label]) => <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}>{label}</button>)}
      </div>
      <h4 className="subhead">Evolução em base 100 <Hint k="Base 100" text="Cada moeda começa em 100 na primeira data do período. Assim moedas de escalas muito diferentes cabem no mesmo gráfico: acima de 100, valorizou contra a base; abaixo, desvalorizou." /></h4>
      {!vs.length ? <p className="nodata">Escolha ao menos uma moeda.</p>
        : h.status === 'error' ? <p className="nodata">sem dados de histórico para esta moeda</p>
        : !hist ? <p className="loading-text"><span className="spinner" aria-hidden="true" /> Carregando…</p>
        : (
          <>
            <ul className="chart__legend">
              {series.map((s, i) => { const ch = seriesChange(s); return <li key={s.code}><i style={{ background: seriesColor(i) }} />{s.code} <b>{signedPct(ch) ?? 'sem dados'}</b></li>; })}
              <li className="chart__period">{hist.items.length ? `${fmtDate(hist.items[0]!.date)} a ${fmtDate(hist.items.at(-1)!.date)}` : ''}</li>
            </ul>
            <LineChart series={series} />
            <details className="chart__table">
              <summary>Ver em tabela</summary>
              <table><thead><tr><th>Data</th>{series.map((s) => <th key={s.code}>{s.code}</th>)}</tr></thead>
                <tbody>{hist.items.filter((_, i, a) => i % Math.ceil(a.length / 24) === 0 || i === a.length - 1).map((it) => (
                  <tr key={it.date}><td>{fmtDate(it.date)}</td>{series.map((s) => <td key={s.code}>{it.rates[s.code] !== undefined ? fmtRate(it.rates[s.code]!) : 'sem dados'}</td>)}</tr>
                ))}</tbody></table>
            </details>
            <p className="src">
              {weekly && 'Janelas longas mostram um ponto por semana (o último dia com dado), não todos os dias. '}
              {secondary && 'Parte das cotações vem de fonte secundária (semanal), menos precisa que a do Banco Central Europeu. '}
              Fonte: {shortSrc(hist.source.title)}.
            </p>
          </>
        )}
    </section>
  );
}

function Converter({ base, vs, rates }: { base: string; vs: string[]; rates: CurrencyDetail['rates'] }) {
  const [other, setOther] = useState(vs[0] ?? 'USD');
  const [amount, setAmount] = useState('100');
  const [side, setSide] = useState<'a' | 'b'>('a');
  useEffect(() => { if (!vs.includes(other) && vs[0]) setOther(vs[0]); }, [vs, other]);
  const map = useMemo(() => Object.fromEntries((rates?.items ?? []).map((i) => [i.code, i.rate])), [rates]);
  const n = Number(amount.replace(',', '.'));
  const valid = amount.trim() !== '' && Number.isFinite(n);
  const out = valid ? convert(n, side === 'a' ? base : other, side === 'a' ? other : base, base, map) : null;
  const fmt = (v: number | null) => (v === null ? '' : v.toLocaleString('pt-BR', { maximumFractionDigits: 4, useGrouping: false }));
  const a = side === 'a' ? amount : fmt(out), b = side === 'b' ? amount : fmt(out);
  if (!rates) return <p className="nodata">Conversor: sem cotações para {base}.</p>;
  return (
    <div className="conv" role="group" aria-label="Conversor">
      <label><span>{base}</span><input inputMode="decimal" value={a} onChange={(e) => { setSide('a'); setAmount(e.target.value); }} /></label>
      <ArrowsLeftRight size={16} weight="light" aria-hidden="true" />
      <label><select value={other} onChange={(e) => setOther(e.target.value)} aria-label="Moeda de destino">{vs.map((c) => <option key={c}>{c}</option>)}</select>
        <input inputMode="decimal" value={b} onChange={(e) => { setSide('b'); setAmount(e.target.value); }} /></label>
      {valid && out === null && <small className="nodata">sem cotação</small>}
    </div>
  );
}

// ---------------------------------------------------------------- Estado da moeda
function State({ cur, anchor }: { cur: CurrencyDetail; anchor: string | undefined }) {
  const s = cur.stats;
  const econ = useAsync(() => api.economy(anchor!), anchor ?? null);
  const infl = econ.status === 'ok' ? econ.data.indicators.find((i) => i.id === 'FP.CPI.TOTL.ZG') : undefined;
  const when = cur.rates ? `em ${fmtDate(cur.rates.date)}` : '';
  const vsUsd = cur.code === 'USD' ? '' : ' contra o dólar';
  const tiles: [string, string | null, string, string?][] = [
    [`Variação em 1 ano${vsUsd}`, signedPct(s?.change_1y), `Atlas, ${when}`],
    [`Variação em 5 anos${vsUsd}`, signedPct(s?.change_5y), `Atlas, ${when}`],
    ['Volatilidade (1 ano)', plainPct(s?.volatility_1y), 'Desvio padrão anualizado das variações diárias (log).'],
    ['Maior queda (1 ano)', signedPct(s?.max_drawdown_1y), 'Maior recuo do pico ao vale no período.'],
    ['Regime cambial', null, 'Sem fonte aberta carregada.'],
    ['Inflação anual', infl?.value != null ? `${infl.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : null, infl?.year ? `Banco Mundial, ${infl.year}` : 'Banco Mundial'],
  ];
  return (
    <section className="psec">
      <h3>Estado da moeda</h3>
      <div className="stats">
        {tiles.map(([label, v, foot]) => (
          <div key={label} className="stat">
            <span className="stat__label">{label}</span>
            <span className="stat__value">{v ?? noData}</span>
            <span className="stat__foot">{foot}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Economia do país
function Economy({ countries, nameOf }: { countries: string[]; nameOf: (iso: string) => string }) {
  const [iso, setIso] = useState(countries[0]!);
  const s = useAsync(() => api.economy(iso), iso);
  return (
    <section className="psec">
      <h3>Economia do país</h3>
      {countries.length > 1 && (
        <label className="cx__sel">País <select value={iso} onChange={(e) => setIso(e.target.value)}>{countries.map((c) => <option key={c} value={c}>{nameOf(c)}</option>)}</select></label>
      )}
      {s.status === 'error' ? <p className="nodata">sem dados de economia</p> : s.status !== 'ok' ? <p className="loading-text"><span className="spinner" aria-hidden="true" /> Carregando…</p> : (
        <>
          <ul className="econ">
            {s.data.indicators.map((i) => (
              <li key={i.id}>
                <span className="econ__label">{i.label}<Hint k={i.id} text={INDICATOR_EXPLANATIONS[i.id]} label={i.label} /></span>
                <span className="econ__value">{i.value !== null ? fmtEconomy(i.unit, i.value) : noData}</span>
                <Sparkline points={i.series} label={i.label} />
                <span className="econ__foot">{i.year ?? 'sem ano'} · {i.unit}</span>
              </li>
            ))}
          </ul>
          <p className="src">Fonte: {s.data.sources.map((x) => shortSrc(x.title)).join('; ')}. Séries dos 20 anos até o último dado de cada indicador; lacunas ficam em branco.</p>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Comparar países
function Compare({ self, cmp, setCmp, names, nameOf }: { self: string; cmp: string[]; setCmp: (c: string[]) => void; names: { iso2: string; name: string }[]; nameOf: (iso: string) => string }) {
  const list = [self, ...cmp];
  const r = useAsync(() => api.compareEconomy(list), cmp.length ? list.join(',') : null);
  const [copied, setCopied] = useState(false);
  const options = names.filter((c) => !list.includes(c.iso2)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const copy = () => { void navigator.clipboard?.writeText(location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); };
  return (
    <section className="psec">
      <h3>Comparar países</h3>
      <div className="cx__chips">
        <span className="cx__chip"><b>{nameOf(self)}</b></span>
        {cmp.map((c, i) => (
          <span key={c} className="cx__chip" style={{ borderColor: seriesColor(i + 1) }}>
            <i style={{ background: seriesColor(i + 1) }} /><b>{nameOf(c)}</b>
            <button onClick={() => setCmp(cmp.filter((x) => x !== c))} aria-label={`Remover ${nameOf(c)}`}><X size={11} aria-hidden="true" /></button>
          </span>
        ))}
      </div>
      <div className="cx__ctl">
        <label>Adicionar país ({list.length}/{MAX_COMPARE})
          <select value="" disabled={list.length >= MAX_COMPARE || !options.length} onChange={(e) => e.target.value && setCmp([...cmp, e.target.value])}>
            <option value="">{options.length ? 'escolher…' : 'carregando…'}</option>
            {options.map((c) => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}
          </select>
        </label>
        {cmp.length > 0 && <button className="more-btn" onClick={copy}>{copied ? 'link copiado' : 'copiar link desta comparação'}</button>}
      </div>
      {!cmp.length ? <p className="note">Escolha de 1 a {MAX_COMPARE - 1} países para comparar os mesmos indicadores lado a lado.</p>
        : r.status === 'error' ? <p className="nodata">sem dados de comparação</p>
        : r.status !== 'ok' ? <p className="loading-text"><span className="spinner" aria-hidden="true" /> Carregando…</p> : (
          <>
            <div className="cmp" role="table" aria-label="Comparação de indicadores econômicos">
              {r.data.indicators.map((i) => {
                const vals = r.data.countries.map((c) => i.values[c] ?? null);
                const max = Math.max(...vals.map((v) => Math.abs(v?.value ?? 0)), 1e-9);
                return (
                  <div key={i.id} className="cmp__row" role="row">
                    <span className="cmp__label" role="rowheader">{i.label}</span>
                    {r.data.countries.map((c, n) => {
                      const v = i.values[c] ?? null;
                      return (
                        <span key={c} className="cmp__cell" role="cell">
                          <span className="cmp__name">{c}</span>
                          <b>{v ? fmtEconomy(i.unit, v.value) : noData}</b>
                          {v && <><i className="cmp__bar" style={{ width: `${(Math.abs(v.value) / max) * 100}%`, background: seriesColor(n === 0 ? 0 : n) }} /><small>{v.year}</small></>}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <p className="src">Fonte: {r.data.sources.map((x) => shortSrc(x.title)).join('; ')}. Cada valor é o último ano disponível do país; os anos podem diferir. Barras: proporção do maior valor da linha (valores negativos em módulo).</p>
          </>
        )}
    </section>
  );
}
