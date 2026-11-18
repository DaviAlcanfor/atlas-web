'use client';
// The app chrome that lives in the root layout (spec 020): globe, readout, layer toggle, footer, glossary dialog.
// The layout stays mounted across /, /pais/[iso2] and /glossario, so the WebGL globe is created once and never remounts.
// Pages render into `children`: the country panel (CountryRoute) or the glossary catalog (GlossaryRoute).
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from './api';
import type { CountryDetail, GlossaryTerm, Source, Subdivision } from './api/types';
import type { StateRef } from './components/Globe';
import { useAsync } from './hooks/useAsync';
import { CountryPanel } from './components/CountryPanel';
import { loadTrade } from './components/Trade';
import { Footer } from './components/Footer';
import { InfoCard } from './components/InfoCard';
import { LoadingScreen } from './components/LoadingScreen';
import { GlobeBoundary, hasWebGL } from './components/GlobeBoundary';
import { LayerToggle, RailButton } from './components/LayerToggle';
import { ChatDrawer } from './components/ChatDrawer';
import { BookOpenText } from '@phosphor-icons/react/dist/csr/BookOpenText';
import { ClockCounterClockwise } from '@phosphor-icons/react/dist/csr/ClockCounterClockwise';
import { CurrencyCircleDollar } from '@phosphor-icons/react/dist/csr/CurrencyCircleDollar';
import { Newspaper } from '@phosphor-icons/react/dist/csr/Newspaper';
import { GlossaryPage, GlossaryProvider } from './glossary';
import { useAtlasData } from './hooks/useAtlasData';
import { nearestYear } from './lib/snapshots';
import { entitySlug, findEntity, loadSnapshot, readTimeParams, timeTitle, tintOf, withTimeParams, type Snapshot } from './lib/timeTravel';
import { eraOf } from './lib/eras';
import { flagPreviewUrl } from './lib/url';
import { formatYear } from './lib/years';
import type { MapTarget } from './lib/chatModes';
import { HistPanel, TimeBar } from './components/TimeTravel';
import { SearchBox, type SearchItem } from './components/SearchBox';
import { RankingLayer, rankColors } from './components/RankingLayer';
import { AtlasProvider, countryPath, selectionFromPath, stateSlugFromPath, statePath, useAtlas } from './state';
import { idOf } from './types';

// three.js touches window/WebGL at import time: browser only, and in its own chunk (pages without the globe skip ~1 MB).
const Globe = dynamic(() => import('./components/Globe').then((m) => m.Globe), { ssr: false });

// spec 035: "Governador: Nome · desde 2023" under a state's name on hover; no head = no line
const headLine = (h: Subdivision['head'] | undefined) => (h ? `${h.office ?? 'Chefe'}: ${h.name}${h.since ? ` · desde ${h.since.slice(0, 4)}` : ''}` : undefined);

const NO_TERMS: never[] = [];
const NO_CAPITALS = new Map<string, never>();
const NO_REGIMES = new Map<string, string>();
const DEFAULT_YEAR = 1914; // where "Viagem no tempo" starts

// While travelling the path is "/": a /pais/ path here is the country the visitor is leaving (its push to "/" is still in flight,
// and writing the old path back would cancel it).
const timeHref = (p: Parameters<typeof withTimeParams>[1]) => {
  const u = new URL(location.href);
  if (p.year !== null && u.pathname.startsWith('/pais/')) u.pathname = '/';
  return withTimeParams(u.toString(), p);
};

interface ShellCtx {
  data: ReturnType<typeof useAtlasData>['data'];
  state: { ref: StateRef; facts: Subdivision | undefined; sources: Source[] } | null; // spec 024: clicked state of the selected country
  clearState: () => void;
}
const ShellContext = createContext<ShellCtx>({ data: null, state: null, clearState: () => {} });

export function Shell({ children }: { children: ReactNode }) {
  return <AtlasProvider><Chrome>{children}</Chrome></AtlasProvider>;
}

function Chrome({ children }: { children: ReactNode }) {
  // The glossary page covers the whole screen: opened directly, it skips the globe (WebGL + ~550 kB gzip of three.js) and the
  // map files. Once a globe route is visited the globe stays mounted for good.
  const path = usePathname();
  const globeRoute = path !== '/glossario' && !path.startsWith('/moeda/') && !path.startsWith('/ideias/') && !path.startsWith('/economia') && !path.startsWith('/noticias'); // full-page routes skip the globe when opened directly
  const [wantGlobe, setWantGlobe] = useState(globeRoute);
  useEffect(() => { if (globeRoute) setWantGlobe(true); }, [globeRoute]);
  const { data, error, apiError, progress } = useAtlasData(wantGlobe);
  const [chunkReady, setChunkReady] = useState(false); // the globe's code (three.js chunk) has arrived
  useEffect(() => { if (wantGlobe) void import('./components/Globe').then(() => setChunkReady(true)); }, [wantGlobe]);
  const { hoveredCountry, selectedCountry, layer, setLayer, setHoveredCountry, setSelectedCountry } = useAtlas();
  const [globeReady, setGlobeReady] = useState(false);
  const [skipGlobe, setSkipGlobe] = useState(false); // spec 028: the visitor chose to enter without waiting for the globe
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [showStates, setShowStates] = useState(false); // spec 023: off by default; the button unlocks the clickable divisions
  const [tradeArcs, setTradeArcs] = useState(false); // spec 029 phase 3: off by default (owner 2026-11-17: heavy); the "Comércio" button shows them
  const [allStateFlags, setAllStateFlags] = useState(true); // spec 026: every state's flag, or only the clicked one
  const [hoverState, setHoverState] = useState<StateRef | null>(null); // hovered state/province of the selected country
  const [pickedState, setPickedState] = useState<StateRef | null>(null); // spec 024: clicked state
  const [chatFocus, setChatFocus] = useState<string | null>(null); // spec 025: first country the chat answer cites (highlight + fly)
  const onChatCountries = useCallback((iso2: string[]) => setChatFocus(iso2[0] ?? null), []);
  useEffect(() => setChatFocus(null), [selectedCountry]);
  const onGlobeReady = useCallback(() => setGlobeReady(true), []);
  const [globeFailed, setGlobeFailed] = useState<string>();
  const onGlobeError = useCallback((msg: string) => setGlobeFailed(msg), []);
  useEffect(() => {
    if (wantGlobe && !hasWebGL()) onGlobeError('Este navegador está com o WebGL desligado, então o globo 3D não aparece. O resto do Atlas funciona normalmente.');
  }, [wantGlobe, onGlobeError]);
  useEffect(() => { setHoverState(null); setPickedState(null); }, [selectedCountry, showStates]);
  // spec 024: the selected country's state facts + flags, only while "Estados" is on; any failure = polygon names, no flags
  const subsReq = useAsync(() => api.subdivisions(selectedCountry!), selectedCountry && showStates ? selectedCountry : null);
  const subs = useMemo(() => new Map(subsReq.status === 'ok' ? subsReq.data.items.map((x) => [x.wikidata_id, x]) : []), [subsReq]);

  // spec 024: a state has its own path (/pais/br/sp, ISO 3166-2). The path turns "Estados" on and selects the state once the
  // API's list arrives; clicking a state or closing its card updates the path.
  const router = useRouter();
  const stateSlug = stateSlugFromPath(path);
  useEffect(() => { if (stateSlug) setShowStates(true); }, [stateSlug]);
  const prevSlug = useRef(stateSlug);
  useEffect(() => {
    const had = prevSlug.current;
    prevSlug.current = stateSlug;
    if (!stateSlug) {
      if (had) setPickedState(null); // back from /pais/br/sp to /pais/br
      return;
    }
    if (!selectedCountry || subsReq.status !== 'ok') return;
    const code = `${selectedCountry}-${decodeURIComponent(stateSlug)}`.toUpperCase();
    const s = subsReq.data.items.find((x) => x.code?.toUpperCase() === code);
    if (s) setPickedState((p) => (p?.id === s.wikidata_id ? p : { name: s.name, id: s.wikidata_id }));
  }, [stateSlug, selectedCountry, subsReq]);
  const selectState = useCallback((s: StateRef | null) => {
    setPickedState(s);
    const p = s?.id && selectedCountry ? statePath(selectedCountry, subs.get(s.id)?.code) : null;
    if (p) router.push(p, { scroll: false });
  }, [selectedCountry, subs, router]);
  const clearState = useCallback(() => {
    setPickedState(null);
    if (stateSlug && selectedCountry) router.push(countryPath(selectedCountry), { scroll: false });
  }, [stateSlug, selectedCountry, router]);
  const factsOf = (s: StateRef | null) => (s?.id ? subs.get(s.id) : undefined);
  const stateFlags = useMemo(() => new Map([...subs].flatMap(([id, x]): [string, string][] =>
    (x.flag && (allStateFlags || id === pickedState?.id) ? [[id, x.flag.url]] : []))), [subs, allStateFlags, pickedState?.id]);

  // spec 012: time travel. `year` null = the present. The slider only stops on snapshot years; a year typed in the URL snaps
  // to the nearest one. While the next snapshot downloads the previous one stays on screen.
  const [year, setYearState] = useState<number | null>(null);
  const [hist, setHist] = useState<Snapshot | null>(null);
  const [histError, setHistError] = useState<string>();
  const [histSel, setHistSel] = useState<string | null>(null);
  const wantEntity = useRef<string | null>(null); // ?entidade= waiting for its snapshot to load (spec 036 C)
  useEffect(() => { // shared links: ?ano=1815&entidade=ottoman-empire
    const { year: y, entity } = readTimeParams(location.search);
    if (y !== null) { setYearState(y); wantEntity.current = entity; }
  }, []);
  const snapsReq = useAsync(() => api.snapshots(), year !== null ? 'snapshots' : null);
  const snaps = snapsReq.status === 'ok' ? snapsReq.data : null;
  const years = useMemo(() => snaps?.map((x) => x.year) ?? [], [snaps]);
  const snapYear = year !== null ? nearestYear(years, year)?.year ?? null : null;
  const setYear = useCallback((y: number | null) => {
    setYearState(y);
    window.history.replaceState(null, '', timeHref(y === null ? { year: null, entity: null } : { year: y }));
  }, []);
  useEffect(() => {
    if (snapYear === null) { setHist(null); setHistSel(null); setHistError(undefined); return; }
    const info = snaps?.find((x) => x.year === snapYear);
    if (!info) return;
    let live = true;
    const t = setTimeout(() => { // dragging the slider passes over many years: only the one it rests on is downloaded
      loadSnapshot(snapYear, info.geometry_url).then(
        (s) => {
          if (!live) return;
          const asked = wantEntity.current && findEntity(s.ids, wantEntity.current); // a shared link names the entity once
          wantEntity.current = null;
          setHist(s); setHistError(undefined); setHistSel((id) => (id && s.ids.has(id) ? id : asked || null));
        },
        (e: Error) => live && setHistError(e.message),
      );
    }, 120);
    return () => { live = false; clearTimeout(t); };
  }, [snapYear, snaps]);
  const timeMode = year !== null && globeRoute;
  const enterTime = useCallback(() => { setSelectedCountry(null); setYear(DEFAULT_YEAR); }, [setSelectedCountry, setYear]);
  useEffect(() => { if (selectedCountry && year !== null) setYear(null); }, [selectedCountry]); // a modern country was opened: back to the present
  // spec 036 C: the URL carries year + entity while travelling. Also re-asserted after each route change: leaving /pais/ve for the
  // time-travel rail pushes "/" and would otherwise drop the query.
  const slugSel = histSel ? entitySlug(histSel) : null;
  useEffect(() => {
    if (!timeMode || wantEntity.current) return;
    const href = timeHref({ year, entity: slugSel });
    if (href !== location.href) window.history.replaceState(null, '', href);
  }, [timeMode, year, slugSel, path, hist]);
  const histLines = useMemo(() => (hist && data ? { borders: hist.borders, coast: data.lines.coast } : null), [hist, data]);
  const modernByName = useMemo(() => new Map([...(data?.names ?? [])].map(([iso, n]) => [n, iso])), [data]);
  const histProps = timeMode && hist ? hist.props.get(histSel ?? '') : undefined;
  // The tab title names the entity, never the modern country the visitor came from (/pais/ve -> Ottoman Empire).
  const title = timeMode ? timeTitle(histProps?.name, formatYear(snapYear ?? year!)) : null;
  useEffect(() => {
    if (!title) return;
    const before = document.title;
    document.title = title;
    return () => { document.title = before; };
  }, [title, path]);
  // spec 039 "mostrar no mapa": year = time travel (the slider snaps to a snapshot, the layer then does not apply); else layer and/or focus
  const knownIso = useMemo(() => (data ? new Set(data.features.flatMap((f) => (f.properties.ISO2 ? [f.properties.ISO2.toUpperCase()] : []))) : null), [data]);
  const onChatMap = useCallback((m: MapTarget) => {
    if (m.year !== undefined) { setSelectedCountry(null); setYear(m.year); return; }
    setYear(null);
    if (m.layer) setLayer(m.layer);
    if (m.iso2.length) setChatFocus(m.iso2[0]!);
  }, [setSelectedCountry, setYear, setLayer]);
  const histHover = timeMode && hist ? hist.props.get(hoveredCountry ?? histSel ?? '') : undefined;

  // Search (spec 026 follow-up): present = countries by their pt-BR name; time travel = the entities of the snapshot on screen.
  const searchItems = useMemo<SearchItem[]>(() => {
    if (timeMode) return hist ? [...hist.props.values()].map((p) => ({ id: p.name_en, name: p.name })) : [];
    return data ? data.features.filter((f) => f.properties.ISO2).map((f) => ({ id: idOf(f), name: data.names.get(idOf(f)) ?? f.properties.NAME, iso2: f.properties.ISO2 })) : [];
  }, [timeMode, hist, data]);
  // spec 027: ranking layer. Catalog and ranking are fetched only while the layer is on.
  const [rankId, setRankId] = useState('HDR.HDI');
  const ranking = layer === 'ranking' && !timeMode;
  const catalogReq = useAsync(() => api.indicators(), ranking ? 'indicators' : null);
  const rankReq = useAsync(() => api.indicatorRanking(rankId), ranking ? rankId : null);
  const rankData = rankReq.status === 'ok' ? rankReq.data : null;
  const rankTint = useMemo(() => {
    if (!rankData) return undefined;
    const colors = rankColors(rankData);
    return (id: string) => colors.get(id);
  }, [rankData]);
  const inPast = timeMode && hist !== null && histLines !== null ? hist : null; // the snapshot on the globe, or null in the present
  // spec 029 phase 3: arcs to the top trade partners (destinations + origins, by combined value), present only. Failure = no arcs.
  const tradeReq = useAsync(() => loadTrade(selectedCountry!), selectedCountry && !timeMode ? selectedCountry : null);
  const partners = useMemo(() => {
    if (tradeReq.status !== 'ok') return undefined;
    const v = new Map<string, number>();
    for (const p of [...tradeReq.data.top_destinations, ...tradeReq.data.top_origins]) v.set(p.iso2, (v.get(p.iso2) ?? 0) + p.value_usd);
    return [...v].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([iso]) => iso);
  }, [tradeReq]);
  const active = hoveredCountry ?? selectedCountry;
  const countryName = useCallback((iso2: string) => data?.names.get(iso2) ?? data?.features.find((f) => idOf(f) === iso2)?.properties.NAME, [data]);
  const name = active ? countryName(active) : undefined; // pt-BR name from the API, Natural Earth's English one as fallback
  const selectedName = selectedCountry ? countryName(selectedCountry) : undefined;
  const terms = data?.glossary ?? NO_TERMS;
  const hoverFlag = hoveredCountry && data?.knownIds.has(hoveredCountry) ? flagPreviewUrl(hoveredCountry) : undefined;

  return (
    <ShellContext.Provider value={{ data, state: pickedState ? { ref: pickedState, facts: factsOf(pickedState), sources: subsReq.status === 'ok' ? subsReq.data.sources : [] } : null, clearState }}>
      <GlossaryProvider terms={terms} countryName={countryName} onPickCountry={setSelectedCountry}>
        {timeMode ? (
          <InfoCard label={histHover ? `Em ${formatYear(snapYear ?? year!)}` : 'Viagem no tempo'} name={histHover?.name ?? formatYear(snapYear ?? year!)} />
        ) : hoverState && selectedName ? (
          <InfoCard label={`Estado em ${selectedName}`} name={factsOf(hoverState)?.name ?? hoverState.name} flagUrl={factsOf(hoverState)?.flag?.url} sub={headLine(factsOf(hoverState)?.head)} />
        ) : (
          <InfoCard label={name ? 'País' : 'Explore o mundo'} name={name ?? 'Atlas'} flagUrl={hoverFlag} />
        )}
        {wantGlobe && !error && !skipGlobe && (
          <LoadingScreen
            target={0.4 * progress.geo + 0.15 * (progress.countries ? 1 : 0) + 0.15 * (chunkReady ? 1 : 0)}
            rendering={!!data}
            done={globeReady}
            failed={globeFailed}
            countries={progress.countries}
            steps={[
              { label: 'Mapas dos países', done: progress.geo >= 1 },
              { label: 'Lista de países (API)', done: progress.countries !== null },
              { label: 'Glossário', done: progress.glossaryDone },
              { label: 'Globo 3D', done: globeReady },
            ]}
            onSkip={() => setSkipGlobe(true)}
          />
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
            <div className={(timeMode ? histProps : selectedCountry) && globeRoute ? 'globe-slot globe-slot--panel' : 'globe-slot'}>
            {/* One Globe instance for both modes (same position in the tree): switching swaps its data, the WebGL scene stays. */}
            {!globeFailed && <GlobeBoundary onError={onGlobeError}>
            <Globe
              features={inPast ? inPast.features : data.features}
              lines={inPast ? histLines! : data.lines}
              apiIds={inPast ? inPast.ids : data.knownIds}
              capitals={inPast ? NO_CAPITALS : data.capitals}
              regimes={inPast ? NO_REGIMES : data.regimes}
              layer={inPast ? 'content' : layer}
              hoveredId={hoveredCountry ?? (inPast ? null : chatFocus)}
              selectedId={inPast ? histSel : selectedCountry}
              focusId={inPast ? null : chatFocus}
              onHover={setHoveredCountry}
              onSelect={inPast ? setHistSel : setSelectedCountry}
              onHoverState={setHoverState}
              selectedStateId={inPast ? null : pickedState?.id ?? null}
              onSelectState={selectState}
              stateFlags={inPast ? undefined : stateFlags}
              showStates={inPast ? false : showStates}
              backdrop={inPast ? data.features : undefined}
              tint={inPast ? tintOf : ranking ? rankTint : undefined}
              era={inPast ? eraOf(inPast.year) : undefined}
              onReady={onGlobeReady}
              onFlagsLoading={setFlagsLoading}
              partners={inPast || !tradeArcs ? undefined : partners}
            />
            </GlobeBoundary>}
            </div>
            {globeRoute && searchItems.length > 0 && (
              <SearchBox items={searchItems} placeholder={timeMode ? 'Buscar Estado neste ano' : 'Buscar país'}
                onPick={timeMode ? setHistSel : setSelectedCountry} />
            )}
            {timeMode && years.length > 0 && (
              <TimeBar years={years} year={snapYear ?? years[0]!} era={eraOf(snapYear ?? years[0]!)} loading={hist?.year !== snapYear && !histError} count={hist?.year === snapYear ? hist.features.length : null}
                error={histError} onYear={setYear} onExit={() => setYear(null)} />
            )}
            {/* No snapshots (API not imported yet) or the list failed: say so and offer the way back, never a dead end. */}
            {timeMode && (snapsReq.status === 'error' || (snaps && !years.length)) && (
              <div className="timebar bracketed" role="alert">
                <div className="timebar__head">
                  <span className="timebar__label">Viagem no tempo</span>
                  <span className="timebar__meta">
                    {snapsReq.status === 'error' ? `Não foi possível carregar: ${snapsReq.error.message}` : 'Os mapas históricos ainda não estão disponíveis.'}
                  </span>
                  <button className="timebar__exit" onClick={() => setYear(null)}>Voltar ao presente</button>
                </div>
              </div>
            )}
            {timeMode && histProps && <HistPanel p={histProps} year={snapYear ?? year!} modern={modernByName.get(histProps.name)} onClose={() => setHistSel(null)} />}
            {!timeMode && <LayerToggle layer={layer}
              ranking={ranking && (
                <RankingLayer catalog={catalogReq.status === 'ok' ? catalogReq.data : null} id={rankId} onId={setRankId}
                  ranking={rankData} error={rankReq.status === 'error' ? rankReq.error.message : undefined}
                  nameOf={(iso) => countryName(iso) ?? iso} onPick={setSelectedCountry} />
              )} onChange={setLayer} regimes={data.regimes} flagsLoading={flagsLoading}
              states={selectedCountry ? { on: showStates, toggle: () => { if (showStates && stateSlug) clearState(); setShowStates((s) => !s); },
                all: allStateFlags, setAll: setAllStateFlags } : undefined}
              trade={selectedCountry && partners?.length ? { on: tradeArcs, toggle: () => setTradeArcs((t) => !t) } : undefined}>
              <RailButton label="Viagem no tempo" icon={ClockCounterClockwise} onClick={enterTime} />
              <RailButton label="Notícias" icon={Newspaper} href="/noticias" />
              <RailButton label="Economia" icon={CurrencyCircleDollar} href="/economia" />
              {terms.length > 0 && <RailButton label="Glossário" icon={BookOpenText} href="/glossario" />}
            </LayerToggle>}
          </>
        )}
        {globeRoute && <ChatDrawer onCountries={onChatCountries} onMap={onChatMap} known={knownIso} screen={{
          country: selectedCountry ? data?.names.get(selectedCountry) ?? null : null, layer, year: timeMode ? snapYear ?? year : null }} />}
        {children}
        <Footer />
      </GlossaryProvider>
    </ShellContext.Provider>
  );
}

/**
 * /pais/[slug]: the panel for the country in the path. `initial` = detail fetched on the server (null = the API has no such
 * country; undefined = the server could not ask, so the panel fetches in the browser).
 */
export function CountryRoute({ slug, initial }: { slug: string; initial: CountryDetail | null | undefined }) {
  const { data, state, clearState } = useContext(ShellContext);
  const { selectedCountry, setSelectedCountry } = useAtlas();
  const id = selectionFromPath(`/pais/${slug}`) ?? slug;
  // A click updates the selection before the new page arrives; the old panel steps aside instead of showing stale data.
  if (selectedCountry !== id) return null;
  const feature = data?.features.find((f) => idOf(f) === id);
  const polygonName = feature?.properties.NAME;
  const inApi = initial !== undefined ? initial !== null : data ? data.knownIds.has(id) : true;
  return (
    <CountryPanel key={id} iso2={id} name={initial?.name ?? polygonName ?? id} inApi={inApi} initial={initial ?? undefined} lat={feature?.properties.lat}
      subdivision={state ?? undefined} onCloseSubdivision={clearState}
      onClose={() => setSelectedCountry(null)} />
  );
}

/**
 * /glossario: the catalog, server-rendered with the terms and pt-BR country names (for the dialog's examples), so it works
 * without the globe's data. "Back" returns to the country that was selected, if any.
 */
export function GlossaryRoute({ terms, names }: { terms: GlossaryTerm[]; names: Record<string, string> }) {
  const router = useRouter();
  const { selectedCountry, setSelectedCountry } = useAtlas();
  const countryName = useCallback((iso2: string) => names[iso2], [names]);
  return (
    <GlossaryProvider terms={terms} countryName={countryName} onPickCountry={setSelectedCountry}>
      <GlossaryPage terms={terms} onBack={() => router.push(selectedCountry ? countryPath(selectedCountry) : '/')} />
    </GlossaryProvider>
  );
}
