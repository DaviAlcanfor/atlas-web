import { regimeColors } from '../lib/regimes';
import type { LayerId } from '../types';

interface Props {
  layer: LayerId;
  onChange: (l: LayerId) => void;
  regimes: Map<string, string>;
}

const LAYERS: { id: LayerId; label: string }[] = [
  { id: 'content', label: 'Com conteúdo' },
  { id: 'regime', label: 'Regime político' },
];

export function LayerToggle({ layer, onChange, regimes }: Props) {
  const colors = regimeColors(regimes);
  return (
    <div className="layer-toggle">
      <div className="layer-toggle__group" role="group" aria-label="Camada do mapa">
        {LAYERS.map((l) => (
          <button key={l.id} aria-pressed={layer === l.id} onClick={() => onChange(l.id)}>{l.label}</button>
        ))}
      </div>
      {layer === 'regime' && (
        <ul className="legend">
          {colors.size === 0 && <li>Sem dados de regime</li>}
          {[...colors].map(([regime, color]) => (
            <li key={regime}><i style={{ background: color }} />{regime}</li>
          ))}
          <li><i className="legend__none" />sem dados</li>
          {/* TODO: remove once the API sources its regime text (today it comes from an unverified legacy seed) */}
          {colors.size > 0 && <li className="legend__warn">Texto de regime não verificado (seed legado).</li>}
        </ul>
      )}
    </div>
  );
}
