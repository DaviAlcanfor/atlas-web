import type { ReactNode } from 'react';
import { regimeGroups } from '../lib/regimes';
import { STREETVIEW, STREETVIEW_SOURCE } from '../lib/streetview';
import type { LayerId } from '../types';

interface Props {
  layer: LayerId;
  onChange: (l: LayerId) => void;
  regimes: Map<string, string>;
  flagsLoading?: boolean; // the flag layer's atlas is still downloading
  states?: { on: boolean; toggle: () => void; all: boolean; setAll: (all: boolean) => void }; // "Estados" button; only while a country is selected
  ranking?: ReactNode; // spec 027: the ranking layer's controls, shown while that layer is on
  children?: ReactNode; // extra chrome under the toggle (glossary link)
}

const LAYERS: { id: LayerId; label: string }[] = [
  { id: 'content', label: 'Padrão' },
  { id: 'regime', label: 'Regime político' },
  { id: 'flags', label: 'Bandeiras' },
  { id: 'geoguessr', label: 'GeoGuessr' },
  { id: 'ranking', label: 'Ranking' },
];

const svCount = (l: string) => Object.values(STREETVIEW).filter((v) => v === l).length;

export function LayerToggle({ layer, onChange, regimes, flagsLoading, states, ranking, children }: Props) {
  const groups = regimeGroups(regimes);
  return (
    <div className="layer-toggle">
      <div className="layer-toggle__row">
      <div className="layer-toggle__group" role="group" aria-label="Camada do mapa">
        {LAYERS.map((l) => (
          <button key={l.id} aria-pressed={layer === l.id} onClick={() => onChange(l.id)}>{l.label}</button>
        ))}
      </div>
      {states && (
        <div className="layer-toggle__group">
          <button aria-pressed={states.on} onClick={states.toggle}>Estados</button>
        </div>
      )}
      {states?.on && (
        <div className="layer-toggle__group" role="group" aria-label="Bandeiras dos estados">
          <button aria-pressed={states.all} onClick={() => states.setAll(true)}>Todas as bandeiras</button>
          <button aria-pressed={!states.all} onClick={() => states.setAll(false)}>Só a selecionada</button>
        </div>
      )}
      </div>
      {layer === 'flags' && flagsLoading && (
        <p className="legend" role="status"><span className="spinner" aria-hidden="true" /> Carregando bandeiras…</p>
      )}
      {layer === 'geoguessr' && (
        <ul className="legend">
          <li><i style={{ background: 'var(--c-ice)' }} />Street View público<span className="legend__n">{svCount('full')}</span></li>
          <li><i style={{ background: 'var(--c-ice-mid)' }} />Cobertura restrita<span className="legend__n">{svCount('partial')}</span></li>
          <li><i className="legend__none" />sem cobertura oficial</li>
          <li className="legend__warn">
            Fonte: <a href={STREETVIEW_SOURCE.url} target="_blank" rel="noreferrer noopener">{STREETVIEW_SOURCE.title}</a> · {STREETVIEW_SOURCE.license} · consultado em {STREETVIEW_SOURCE.retrieved}
          </li>
        </ul>
      )}
      {layer === 'ranking' && ranking}
      {layer === 'regime' && (
        <ul className="legend">
          {groups.length === 0 && <li>Sem dados de regime</li>}
          {groups.map((g) => (
            <li key={g.label} title={g.members.length > 1 ? g.members.join(', ') : undefined}>
              <i style={{ background: g.color }} />{g.label}<span className="legend__n">{g.count}</span>
            </li>
          ))}
          <li><i className="legend__none" />sem dados</li>
          {/* TODO: remove once the API sources its regime text (today it comes from an unverified legacy seed) */}
          {groups.length > 0 && <li className="legend__warn">Texto de regime não verificado (seed legado).</li>}
        </ul>
      )}
      {children}
    </div>
  );
}
