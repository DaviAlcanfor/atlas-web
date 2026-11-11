import { regimeColors } from '../lib/regimes';
import type { LayerId } from '../types';

interface Props {
  layer: LayerId;
  onChange: (l: LayerId) => void;
  regimes: Map<string, string>;
}

const LAYERS: { id: LayerId; label: string }[] = [
  { id: 'content', label: 'Has content' },
  { id: 'regime', label: 'Political regime' },
];

export function LayerToggle({ layer, onChange, regimes }: Props) {
  const colors = regimeColors(regimes);
  return (
    <div className="layer-toggle" role="group" aria-label="Map layer">
      {LAYERS.map((l) => (
        <button key={l.id} aria-pressed={layer === l.id} onClick={() => onChange(l.id)}>{l.label}</button>
      ))}
      {layer === 'regime' && (
        <ul className="legend">
          {colors.size === 0 && <li>No regime data</li>}
          {[...colors].map(([regime, color]) => (
            <li key={regime}><i style={{ background: color }} />{regime}</li>
          ))}
          <li><i className="legend__none" />no data</li>
          {/* TODO: remove once the API sources its regime text (today it comes from an unverified legacy seed) */}
          {colors.size > 0 && <li className="legend__warn">Regime text is unverified (legacy seed).</li>}
        </ul>
      )}
    </div>
  );
}
