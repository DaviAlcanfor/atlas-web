import { Globe } from './components/Globe';
import { InfoCard } from './components/InfoCard';
import { useAtlasData } from './hooks/useAtlasData';
import { useAtlas } from './state';
import { idOf } from './types';

export default function App() {
  const { data, error } = useAtlasData();
  const { hoveredCountry, selectedCountry, setHoveredCountry, setSelectedCountry } = useAtlas();

  const active = hoveredCountry ?? selectedCountry;
  const name = data?.features.find((f) => idOf(f) === active)?.properties.NAME;

  return (
    <>
      <InfoCard label={name ? 'COUNTRY' : 'EXPLORE THE WORLD'} name={name ?? 'Atlas'} />
      {error && (
        <p className="load-error" role="alert">
          Could not load map data: {error}
        </p>
      )}
      {data && (
        <Globe
          {...data}
          hoveredId={hoveredCountry}
          selectedId={selectedCountry}
          onHover={setHoveredCountry}
          onSelect={setSelectedCountry}
        />
      )}
    </>
  );
}
