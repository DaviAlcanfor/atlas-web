// Spec 015: "Como vive o povo" — 4 collapsible groups of indicators with a world ruler, plus religion/ethnicity composition bars.
import type { CSSProperties } from 'react';
import { api } from '../api';
import type { CountryProfile, ProfileIndicator, Source } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { INDICATOR_EXPLANATIONS } from '../lib/explanations';
import { regimeOther, regimePalette } from '../lib/palette';
import { formatIndicator, indicatorTip, pct, rankText, rulerPos, topSlices, type Slice } from '../lib/profile';
import { Hint } from './Hint';
import { Section } from './Section';
import { Tooltip } from './Tooltip';

const GROUP_TITLE = { life: 'Vida', society: 'Sociedade', income: 'Desigualdade e renda', environment: 'Ambiente' } as const;
const shortSource = (sources: Source[], id: string) => (sources.find((s) => s.id === id)?.title ?? id).split(':')[0]!.trim();

/** Value, year, source and a ruler: hairline from the world's min to max, a tick at the median, a dot for the country. No filled track. */
export function IndicatorRow({ i, sources }: { i: ProfileIndicator; sources: Source[] }) {
  const { text, note } = formatIndicator(i);
  const tip = indicatorTip(i);
  const rt = rankText(i.id, i.rank, i.rank_of);
  const row = (
    <>
      <span className="ind__label">{i.label}</span>
      <span className="ind__value">{text}{note && <small>{note}</small>}</span>
      {i.world && (
        <span className="ruler" aria-hidden="true">
          <i className="ruler__median" style={{ left: `${rulerPos(i.world.median, i.world) * 100}%` }} />
          <i className="ruler__dot" style={{ left: `${rulerPos(i.value, i.world) * 100}%` }} />
        </span>
      )}
      <span className="ind__foot">{i.year} · {shortSource(sources, i.source_id)}{rt && ` · ${rt}`}</span>
    </>
  );
  return (
    <li className="ind">
      {tip ? (
        <Tooltip text={tip}>{(aria) => <div className="ind__body" tabIndex={0} role="group" aria-label={`${i.label}: ${text} ${note}`.trim()} {...aria}>{row}</div>}</Tooltip>
      ) : <div className="ind__body">{row}</div>}
      <div className="ind__head"><Hint k={i.id} text={INDICATOR_EXPLANATIONS[i.id]} label={i.label} /></div>
    </li>
  );
}

const sliceColor = (s: Slice, n: number) => (s.label === 'outros' ? regimeOther : regimePalette[n % regimePalette.length]!);

/** Stacked horizontal bar: top 5 groups + "outros", fractions 0-1. Legend carries the labels (colour is not the only encoding). */
export function CompositionBar({ title, items, year, source }: { title: string; items: Slice[]; year: number | null; source: string }) {
  const slices = topSlices(items);
  return (
    <div className="comp">
      <h4 className="subhead">{title}<Hint k={title} /></h4>
      <div className="comp__bar" role="img" aria-label={`${title}: ${slices.map((s) => `${s.label} ${pct(s.share)}`).join(', ')}`}>
        {slices.map((s, n) => <i key={s.label} style={{ flexGrow: s.share, background: sliceColor(s, n) } as CSSProperties} title={`${s.label}: ${pct(s.share)}`} />)}
      </div>
      <ul className="comp__legend">
        {slices.map((s, n) => <li key={s.label}><i style={{ background: sliceColor(s, n) }} />{s.label} <b>{pct(s.share)}</b></li>)}
      </ul>
      <p className="src">{year !== null ? `${year} · ` : ''}{source}</p>
    </div>
  );
}

function Groups({ p }: { p: CountryProfile }) {
  const groups = p.groups.filter((g) => g.indicators.length || (g.id === 'society' && (p.composition.religion || p.composition.ethnicity)));
  if (!groups.length) return null;
  const c = p.composition;
  const csrc = c.source_id ? shortSource(p.sources, c.source_id) : '';
  return (
    <Section title="Como vive o povo">
      {groups.map((g, n) => (
        <details key={g.id} className="pgroup" open={n < 2}>
          <summary>{GROUP_TITLE[g.id]} <span>{g.indicators.length}</span></summary>
          <ul className="inds">{g.indicators.map((i) => <IndicatorRow key={i.id} i={i} sources={p.sources} />)}</ul>
          {g.id === 'society' && c.religion && <CompositionBar title="Religiões" items={c.religion} year={c.year} source={csrc} />}
          {g.id === 'society' && c.ethnicity && <CompositionBar title="Grupos étnicos" items={c.ethnicity} year={c.year} source={csrc} />}
        </details>
      ))}
      <p className="src">Fontes: {p.sources.map((s) => s.title.split(':')[0]).join('; ')}. Régua: mínimo a máximo do mundo; traço = mediana mundial; ponto = o país.</p>
    </Section>
  );
}

/** Fetches the profile in the browser; any failure (v1.1 production 404, network) hides the section. */
export function ProfileSection({ iso2 }: { iso2: string }) {
  const s = useAsync(() => api.profile(iso2), iso2);
  return s.status === 'ok' ? <Groups p={s.data} /> : null;
}
