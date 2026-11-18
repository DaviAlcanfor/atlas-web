import { useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { Binoculars } from '@phosphor-icons/react/dist/csr/Binoculars';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { ArrowsLeftRight } from '@phosphor-icons/react/dist/csr/ArrowsLeftRight';
import { Flag } from '@phosphor-icons/react/dist/csr/Flag';
import { FlagPennant } from '@phosphor-icons/react/dist/csr/FlagPennant';
import { Scales } from '@phosphor-icons/react/dist/csr/Scales';
import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { Stack } from '@phosphor-icons/react/dist/csr/Stack';
import { Trophy } from '@phosphor-icons/react/dist/csr/Trophy';
import { Hint } from './Hint';
import type { TradeArcLine } from '../lib/tradeArcs';
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
  trade?: { on: boolean; toggle: () => void; self: string; lines: TradeArcLine[] }; // spec 029 phase 3: trade arcs on/off; only while the selected country has trade data
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

// spec 040: the (i) beside the trade legend title. Fixed text.
const COMERCIO_INFO = 'Liga o país selecionado aos 10 parceiros que mais compram ou vendem para ele (mercadorias, fonte BACI/CEPII). A lista ao lado diz quem é quem e quanto; a seta mostra o sentido: → exporta, ← importa, ⇄ os dois.';

const svCount = (l: string) => Object.values(STREETVIEW).filter((v) => v === l).length;

/** One button of the rail, icon + name (icons alone were hard to guess): a toggle (`onClick` + `pressed`) or a link (`href`). */
export function RailButton({ label, icon: Ico, pressed, onClick, href }: { label: string; icon: IconType; pressed?: boolean; onClick?: () => void; href?: string }) {
  const body = <><Ico size={16} weight="light" aria-hidden />{label}</>;
  const btn = href
    ? <Link className="rail__btn" href={href}>{body}</Link>
    : <button type="button" className="rail__btn" aria-pressed={pressed} onClick={onClick}>{body}</button>;
  return btn;
}

export function LayerToggle({ layer, onChange, regimes, flagsLoading, states, trade, ranking, children }: Props) {
  const groups = regimeGroups(regimes);
  const [open, setOpen] = useState(false); // spec 030: phones only; on desktop the rail is always shown
  const current = LAYERS.find((l) => l.id === layer)!;
  return (
    <div className="layer-toggle" data-open={open}>
      <button type="button" className="layer-toggle__menu" aria-expanded={open} aria-controls="rail" onClick={() => setOpen((o) => !o)}>
        <List size={18} weight="light" aria-hidden /><span>{current.label}</span>
      </button>
      {/* any pick inside closes the phone menu (no effect on desktop) */}
      <nav id="rail" className="rail" aria-label="Camadas e páginas" onClick={(e) => (e.target as Element).closest('button:not(.hint), a') && setOpen(false)}>
        <div className="rail__group" role="group" aria-label="Camada do mapa">
          {LAYERS.map((l) => (
            <RailButton key={l.id} label={l.label} icon={l.icon} pressed={layer === l.id} onClick={() => onChange(l.id)} />
          ))}
        </div>
        {(states || trade) && (
          <div className="rail__group">
            {trade && <RailButton label="Comércio" icon={ArrowsLeftRight} pressed={trade.on} onClick={trade.toggle} />}
            {states && <RailButton label="Estados" icon={SquaresFour} pressed={states.on} onClick={states.toggle} />}
            {states?.on && (
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
        {trade?.on && (
          <section className="legend legend--trade" aria-label="Linhas de comércio no globo">
            <h2 className="legend__h">Comércio de {trade.self} <Hint k="Comércio" text={COMERCIO_INFO} /></h2>
            <ul>
              {trade.lines.map((l) => (
                <li key={l.iso}><span>{l.label}</span><span className="legend__n">{l.detail}</span></li>
              ))}
            </ul>
          </section>
        )}
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
