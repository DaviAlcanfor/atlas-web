import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { Binoculars } from '@phosphor-icons/react/dist/csr/Binoculars';
import { Flag } from '@phosphor-icons/react/dist/csr/Flag';
import { FlagPennant } from '@phosphor-icons/react/dist/csr/FlagPennant';
import { Scales } from '@phosphor-icons/react/dist/csr/Scales';
import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { Stack } from '@phosphor-icons/react/dist/csr/Stack';
import { Trophy } from '@phosphor-icons/react/dist/csr/Trophy';
import { regimeGroups } from '../lib/regimes';
import { STREETVIEW, STREETVIEW_SOURCE } from '../lib/streetview';
import type { LayerId } from '../types';

// spec 028: one vertical rail at the bottom left, each button with its icon and its name.
type IconType = ComponentType<{ size?: number; weight?: 'light'; 'aria-hidden'?: boolean }>;

interface Props {
  layer: LayerId;
  onChange: (l: LayerId) => void;
  regimes: Map<string, string>;
  flagsLoading?: boolean; // the flag layer's atlas is still downloading
  states?: { on: boolean; toggle: () => void; all: boolean; setAll: (all: boolean) => void }; // "Estados" button; only while a country is selected
  ranking?: ReactNode; // spec 027: the ranking layer's controls, shown while that layer is on
  children?: ReactNode; // RailButton items for the pages (time travel, news, economy, glossary)
}

const LAYERS: { id: LayerId; label: string; icon: IconType }[] = [
  { id: 'content', label: 'Padrão', icon: Stack },
  { id: 'regime', label: 'Regime político', icon: Scales },
  { id: 'flags', label: 'Bandeiras', icon: Flag },
  { id: 'geoguessr', label: 'GeoGuessr', icon: Binoculars },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
];

const svCount = (l: string) => Object.values(STREETVIEW).filter((v) => v === l).length;

/** One button of the rail, icon + name (icons alone were hard to guess): a toggle (`onClick` + `pressed`) or a link (`href`). */
export function RailButton({ label, icon: Ico, pressed, onClick, href }: { label: string; icon: IconType; pressed?: boolean; onClick?: () => void; href?: string }) {
  const body = <><Ico size={16} weight="light" aria-hidden />{label}</>;
  return href
    ? <Link className="rail__btn" href={href}>{body}</Link>
    : <button type="button" className="rail__btn" aria-pressed={pressed} onClick={onClick}>{body}</button>;
}

export function LayerToggle({ layer, onChange, regimes, flagsLoading, states, ranking, children }: Props) {
  const groups = regimeGroups(regimes);
  return (
    <div className="layer-toggle">
      <nav className="rail" aria-label="Camadas e páginas">
        <div className="rail__group" role="group" aria-label="Camada do mapa">
          {LAYERS.map((l) => (
            <RailButton key={l.id} label={l.label} icon={l.icon} pressed={layer === l.id} onClick={() => onChange(l.id)} />
          ))}
        </div>
        {states && (
          <div className="rail__group">
            <RailButton label="Estados" icon={SquaresFour} pressed={states.on} onClick={states.toggle} />
            {states.on && (
              <>
                <RailButton label="Todas as bandeiras" icon={Flag} pressed={states.all} onClick={() => states.setAll(true)} />
                <RailButton label="Só a selecionada" icon={FlagPennant} pressed={!states.all} onClick={() => states.setAll(false)} />
              </>
            )}
          </div>
        )}
        {children && <div className="rail__group">{children}</div>}
      </nav>
      <div className="layer-toggle__aside">
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
      </div>
    </div>
  );
}
