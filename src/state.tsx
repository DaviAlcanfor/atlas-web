import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LayerId } from './types';

interface AtlasState {
  selectedCountry: string | null;
  hoveredCountry: string | null;
  layer: LayerId;
  year: number | null; // null = today (modern layer)
}
interface AtlasCtx extends AtlasState {
  setSelectedCountry: (id: string | null) => void;
  setHoveredCountry: (id: string | null) => void;
  setLayer: (l: LayerId) => void;
  setYear: (y: number | null) => void;
}

const Ctx = createContext<AtlasCtx | null>(null);

// URL hash <-> state, e.g. #c=AT&y=1815
function readHash(): Pick<AtlasState, 'selectedCountry' | 'year'> {
  const p = new URLSearchParams(location.hash.slice(1));
  const y = Number(p.get('y'));
  return { selectedCountry: p.get('c'), year: p.has('y') && Number.isFinite(y) ? y : null };
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readHash, []);
  const [selectedCountry, setSelectedCountry] = useState(initial.selectedCountry);
  const [year, setYear] = useState(initial.year);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [layer, setLayer] = useState<LayerId>('content');

  useEffect(() => {
    const p = new URLSearchParams();
    if (selectedCountry) p.set('c', selectedCountry);
    if (year !== null) p.set('y', String(year));
    history.replaceState(null, '', p.size ? '#' + p : location.pathname + location.search);
  }, [selectedCountry, year]);

  useEffect(() => {
    const onHash = () => {
      const h = readHash();
      setSelectedCountry(h.selectedCountry);
      setYear(h.year);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const value = { selectedCountry, hoveredCountry, layer, year, setSelectedCountry, setHoveredCountry, setLayer, setYear };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAtlas() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAtlas outside AtlasProvider');
  return v;
}
