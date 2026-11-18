// Spec 041 (CR-017, v1.15): "Tecnologia e chips" on /economia/[iso2]. Hidden while loading, on any failure and when `products` is empty
// (the API answers empty until the owner runs the import), exactly like the trade blocks. Labels are shown verbatim (MDIC/Secex, CC BY-ND).
import { api } from '../api';
import type { CountryTech } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { compact } from '../lib/currency';
import { pct } from '../lib/profile';
import { Foot, partners, ShareList } from './Trade';

// One request per country per page load, shared by the index entry and the block.
const cache = new Map<string, Promise<CountryTech>>();
export const loadTech = (iso2: string) => { let p = cache.get(iso2); if (!p) cache.set(iso2, (p = api.tech(iso2))); return p; };

export const hasTech = (s: ReturnType<typeof useAsync<CountryTech>>) => s.status === 'ok' && s.data.products.length > 0;

export function TechSection({ data }: { data: CountryTech }) {
  const byHs = new Map<string, CountryTech['products']>();
  for (const p of data.products) byHs.set(p.hs, [...(byHs.get(p.hs) ?? []), p]);
  return (
    <>
      <div className="tech">
        {[...byHs].map(([hs, ps]) => (
          <article key={hs} className="tech__card">
            <h3>{ps[0]?.label} <small className="mono">SH {hs}</small></h3>
            <div className="tech__flows">
              {(['export', 'import'] as const).map((flow) => {
                const p = ps.find((x) => x.flow === flow);
                if (!p) return null;
                return (
                  <div key={flow}>
                    <h4 className="subhead">{flow === 'export' ? 'Exportação' : 'Importação'}</h4>
                    <p className="tech__value">US$ {compact(p.value_usd)} <small>{pct(p.share)} {flow === 'export' ? 'das exportações' : 'das importações'}</small></p>
                    {p.partners.length > 0 && <ShareList items={partners(p.partners.slice(0, 5))} />}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
      <Foot t={data} />
      <p className="src">Rótulos dos produtos: MDIC/Secex, licença CC BY-ND 3.0 (reproduzidos sem alteração). Parceiros: até 5 por fluxo; parte do produto no fluxo.</p>
    </>
  );
}
