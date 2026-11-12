import { useCallback, useEffect, useState } from 'react';
import { CountryPanel } from './components/CountryPanel';
import { GlossaryPage, GlossaryProvider } from './glossary';
import { flagPreviewUrl } from './lib/url';
import { Footer } from './components/Footer';
import { Globe } from './components/Globe';
import { InfoCard } from './components/InfoCard';
import { LayerToggle } from './components/LayerToggle';
import { useAtlasData } from './hooks/useAtlasData';
import { useAtlas } from './state';
import { idOf } from './types';

const NO_TERMS: never[] = [];

export default function App() {
  const { data, error, apiError } = useAtlasData();
  const { hoveredCountry, selectedCountry, layer, glossaryPage, setLayer, setHoveredCountry, setSelectedCountry, setGlossaryPage } = useAtlas();
  const [globeReady, setGlobeReady] = useState(false);
  const [wide, setWide] = useState(false);
  const [stateName, setStateName] = useState<string | null>(null); // hovered state/province of the selected country
  const onGlobeReady = useCallback(() => setGlobeReady(true), []);
  useEffect(() => setStateName(null), [selectedCountry]);

  const active = hoveredCountry ?? selectedCountry;
  const name = data?.features.find((f) => idOf(f) === active)?.properties.NAME;
  const selectedName = data?.features.find((f) => idOf(f) === selectedCountry)?.properties.NAME;

  const countryName = useCallback((iso2: string) => data?.names.get(iso2) ?? data?.features.find((f) => idOf(f) === iso2)?.properties.NAME, [data]);
  const pickCountry = useCallback((iso2: string) => { setGlossaryPage(false); setSelectedCountry(iso2); }, [setGlossaryPage, setSelectedCountry]);
  const terms = data?.glossary ?? NO_TERMS;
  const hoverFlag = hoveredCountry && data?.knownIds.has(hoveredCountry) ? flagPreviewUrl(hoveredCountry) : undefined;

  return (
    <GlossaryProvider terms={terms} countryName={countryName} onPickCountry={pickCountry}>
      {stateName && selectedName ? (
        <InfoCard label={`Estado em ${selectedName}`} name={stateName} />
      ) : (
        <InfoCard label={name ? 'País' : 'Explore o mundo'} name={name ?? 'Atlas'} flagUrl={hoverFlag} />
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
            apiIds={data.knownIds}
            capitals={data.capitals}
            regimes={data.regimes}
            layer={layer}
            hoveredId={hoveredCountry}
            selectedId={selectedCountry}
            onHover={setHoveredCountry}
            onSelect={setSelectedCountry}
            onHoverState={setStateName}
            onReady={onGlobeReady}
          />
          <LayerToggle layer={layer} onChange={setLayer} regimes={data.regimes}>
            {terms.length > 0 && <a className="chrome-link" href="#/glossario">Glossário</a>}
          </LayerToggle>
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
      {glossaryPage && data && <GlossaryPage terms={terms} onBack={() => setGlossaryPage(false)} />}
      <Footer />
    </GlossaryProvider>
  );
}
