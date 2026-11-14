// Spec 027: the "Ranking" layer's controls (bottom left): which indicator, the colour scale and the top 10.
// The globe paints each country by its rank septile (lib/palette rankRamp); countries without a value stay dim.
import type { IndicatorRanking, RankedIndicator } from '../api/types';
import { fmtEconomy } from '../lib/currency';
import { rankRamp } from '../lib/palette';
import { flagPreviewUrl } from '../lib/url';

/** Septile of a rank: 0 = lowest values, 6 = highest. */
export const bucketOf = (rank: number, n: number) =>
  n < 2 ? rankRamp.length - 1 : Math.max(0, Math.min(rankRamp.length - 1, Math.floor(((n - rank) / (n - 1)) * rankRamp.length)));

/** iso2 -> colour of its bucket, for Globe's `tint`. */
export function rankColors(r: IndicatorRanking): Map<string, string> {
  const n = r.items.length;
  return new Map(r.items.map((x) => [x.iso2, rankRamp[bucketOf(x.rank, n)]!]));
}

const fmt = (unit: string, v: number) => (unit === 'hab/km²' ? `${Math.round(v).toLocaleString('pt-BR')} hab/km²` : fmtEconomy(unit, v));

interface Props {
  catalog: RankedIndicator[] | null;
  id: string;
  onId: (id: string) => void;
  ranking: IndicatorRanking | null;
  error?: string;
  nameOf: (iso2: string) => string;
  onPick: (iso2: string) => void;
}

export function RankingLayer({ catalog, id, onId, ranking, error, nameOf, onPick }: Props) {
  const top = ranking?.items.slice(0, 10) ?? [];
  return (
    <div className="ranking">
      <label className="ranking__pick">Indicador
        <select value={id} onChange={(e) => onId(e.target.value)} disabled={!catalog}>
          {catalog ? catalog.map((c) => <option key={c.id} value={c.id}>{c.label}</option>) : <option>carregando…</option>}
        </select>
      </label>
      {error && <p className="nodata">sem dados: {error}</p>}
      {ranking && (
        <>
          <div className="ranking__scale" role="img" aria-label="Escala: mais escuro = menor valor, mais claro = maior valor">
            <span>menor</span>
            {rankRamp.map((c) => <i key={c} style={{ background: c }} />)}
            <span>maior</span>
          </div>
          <p className="ranking__note">Cor = faixa do país na posição (cada faixa tem ~1/7 dos {ranking.items.length} países). Pontos apagados: sem dado. 1º = maior valor, não necessariamente o melhor.</p>
          <ol className="ranking__top" aria-label={`10 maiores valores: ${ranking.label}`}>
            {top.map((x) => {
              const flag = flagPreviewUrl(x.iso2);
              return (
                <li key={x.iso2}>
                  <button onClick={() => onPick(x.iso2)}>
                    <span className="ranking__pos">{x.rank}º</span>
                    {flag && <img src={flag} alt="" width={20} height={14} />}
                    <span className="ranking__name">{nameOf(x.iso2)}</span>
                    <span className="ranking__val">{fmt(ranking.unit, x.value)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="ranking__src">{ranking.unit} · Fonte: {ranking.sources.map((s) => s.title.split(':')[0]).join('; ') || 'sem dados'}</p>
        </>
      )}
    </div>
  );
}
