import { useCallback, useEffect, useState } from 'react';
import { CountryPanel } from './components/CountryPanel';
import { Footer } from './components/Footer';
import { Globe } from './components/Globe';
import { InfoCard } from './components/InfoCard';
import { LayerToggle } from './components/LayerToggle';
import { useAtlasData } from './hooks/useAtlasData';
import { useAtlas } from './state';
import { idOf } from './types';

export default function App() {
  const { data, error, apiError } = useAtlasData();
  const { hoveredCountry, selectedCountry, layer, setLayer, setHoveredCountry, setSelectedCountry } = useAtlas();
  const [globeReady, setGlobeReady] = useState(false);
  const [wide, setWide] = useState(false);
  const [stateName, setStateName] = useState<string | null>(null); // hovered state/province of the selected country
  const onGlobeReady = useCallback(() => setGlobeReady(true), []);
  useEffect(() => setStateName(null), [selectedCountry]);

  const active = hoveredCountry ?? selectedCountry;
  const name = data?.features.find((f) => idOf(f) === active)?.properties.NAME;
  const selectedName = data?.features.find((f) => idOf(f) === selectedCountry)?.properties.NAME;

  return (
    <>
      {stateName && selectedName ? (
        <InfoCard label={`Estado em ${selectedName}`} name={stateName} />
      ) : (
        <InfoCard label={name ? 'País' : 'Explore o mundo'} name={name ?? 'Atlas'} />
      )}
      {!error && !globeReady && (
        <div className="loading-screen" role="status" aria-live="polite">
          <span className="spinner spinner--big" aria-hidden="true" />
          <p>{data ? 'Desenhando o globo…' : 'Carregando mapas e países…'}</p>
        </div>
      )}
      {error && (
        <p className="load-error" role="alert">
          Não foi possível carregar o mapa: {error}
        </p>
      )}
      {apiError && (
        <p className="load-error" role="alert">
          Não foi possível acessar a API do Atlas; os dados dos países estão indisponíveis: {apiError}
        </p>
      )}
      {data && (
        <>
          <Globe
            features={data.features}
            lines={data.lines}
            contentIds={data.contentIds}
            apiIds={data.knownIds}
            regimes={data.regimes}
            layer={layer}
            hoveredId={hoveredCountry}
            selectedId={selectedCountry}
            onHover={setHoveredCountry}
            onSelect={setSelectedCountry}
            onHoverState={setStateName}
            onReady={onGlobeReady}
          />
          <LayerToggle layer={layer} onChange={setLayer} regimes={data.regimes} />
          {selectedCountry && selectedName && (
            <CountryPanel
              key={selectedCountry}
              iso2={selectedCountry}
              name={selectedName}
              inApi={data.knownIds.has(selectedCountry)}
              wide={wide}
              onToggleWide={() => setWide((w) => !w)}
              onClose={() => setSelectedCountry(null)}
            />
          )}
        </>
      )}
      <Footer />
    </>
  );
}
