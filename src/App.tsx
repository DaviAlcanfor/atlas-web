import { useCallback, useState } from 'react';
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
  const onGlobeReady = useCallback(() => setGlobeReady(true), []);

  const active = hoveredCountry ?? selectedCountry;
  const name = data?.features.find((f) => idOf(f) === active)?.properties.NAME;
  const selectedName = data?.features.find((f) => idOf(f) === selectedCountry)?.properties.NAME;

  return (
    <>
      <InfoCard label={name ? 'COUNTRY' : 'EXPLORE THE WORLD'} name={name ?? 'Atlas'} />
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
            regimes={data.regimes}
            layer={layer}
            hoveredId={hoveredCountry}
            selectedId={selectedCountry}
            onHover={setHoveredCountry}
            onSelect={setSelectedCountry}
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
