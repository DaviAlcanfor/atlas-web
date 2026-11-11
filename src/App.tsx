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

  const active = hoveredCountry ?? selectedCountry;
  const name = data?.features.find((f) => idOf(f) === active)?.properties.NAME;
  const selectedName = data?.features.find((f) => idOf(f) === selectedCountry)?.properties.NAME;

  return (
    <>
      <InfoCard label={name ? 'COUNTRY' : 'EXPLORE THE WORLD'} name={name ?? 'Atlas'} />
      {error && (
        <p className="load-error" role="alert">
          Could not load map data: {error}
        </p>
      )}
      {apiError && (
        <p className="load-error" role="alert">
          Could not reach the Atlas API, so country data is unavailable: {apiError}
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
          />
          <LayerToggle layer={layer} onChange={setLayer} regimes={data.regimes} />
          {selectedCountry && selectedName && (
            <CountryPanel
              key={selectedCountry}
              iso2={selectedCountry}
              name={selectedName}
              inApi={data.knownIds.has(selectedCountry)}
              onClose={() => setSelectedCountry(null)}
            />
          )}
        </>
      )}
      <Footer />
    </>
  );
}
