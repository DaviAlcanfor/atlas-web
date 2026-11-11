import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactGlobe, { type GlobeMethods } from 'react-globe.gl';
import { createHatchMaterial, createOceanMaterial, createSolidMaterial } from '../lib/hatchMaterial';
import { palette } from '../lib/palette';
import { drawStars } from '../lib/stars';
import { geoBounds, geoContains } from 'd3-geo';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';
import { regimeColors } from '../lib/regimes';
import { idOf, type CountryFeature, type LayerId, type Lines } from '../types';

const ALT_BASE = 0.004;
const ALT_SELECTED = 0.015;
const ALT_LINE = 0.0042;
const MIN_ALTITUDE = 0.15;
const START = { lat: 35, lng: -15, altitude: 0.92 }; // spec said altitude ~1.8; reference screenshot 2 measures ~0.92

interface PathDatum {
  points: number[][];
}

const GLOBE_RADIUS = 100; // three-globe constant

// One merged LineSegments per line set = 1 draw call (the paths layer makes 1 object per line: ~1500, too slow).
// raycast is disabled: hover is handled by the polygons, and raycasting 100k line points per pointer move was costly.
function buildLines(paths: number[][][], color: string): LineSegments {
  const pos: number[] = [];
  const r = GLOBE_RADIUS * (1 + ALT_LINE);
  const xyz = (lng: number, lat: number) => {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((90 - lng) * Math.PI) / 180;
    return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)] as const;
  };
  for (const line of paths) {
    for (let i = 1; i < line.length; i++) {
      pos.push(...xyz(line[i - 1]![0]!, line[i - 1]![1]!), ...xyz(line[i]![0]!, line[i]![1]!));
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  const mesh = new LineSegments(geo, new LineBasicMaterial({ color }));
  mesh.raycast = () => {};
  return mesh;
}

interface Props {
  features: CountryFeature[];
  lines: Lines;
  contentIds: Set<string>;
  layer: LayerId;
  regimes: Map<string, string>; // iso2 -> regime text (only countries where the API has one)
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

const setMarkerVisible = (el: object, visible: boolean) => {
  (el as HTMLElement).style.visibility = visible ? '' : 'hidden'; // not display: CSS2DRenderer overwrites that
};
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Globe({ features, lines, contentIds, layer, regimes, hoveredId, selectedId, onHover, onSelect }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const stars = useRef<HTMLCanvasElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (stars.current) drawStars(stars.current, size.w, size.h);
  }, [size]);

  const mats = useMemo(
    () => ({
      ocean: createOceanMaterial(),
      hatch: createHatchMaterial(palette.landBase),
      hatchHover: createHatchMaterial(palette.landHover),
      content: createSolidMaterial(palette.cream),
      hover: createSolidMaterial(palette.creamHover),
      selected: createSolidMaterial(palette.creamSelected),
    }),
    [],
  );

  const select = useCallback(
    (f: CountryFeature | undefined) => {
      if (!f) return;
      onSelect(idOf(f));
      const g = globe.current;
      const ms = reducedMotion() ? 0 : 900;
      g?.pointOfView({ lat: f.properties.lat, lng: f.properties.lng, altitude: 0.9 }, ms);
      if (!ms) requestAnimationFrame(() => g?.controls().update());
    },
    [onSelect],
  );

  // Micro-state markers: real <button>s so they are keyboard-focusable. Created once; styled via classes.
  const markers = useMemo(() => {
    const map = new Map<string, HTMLButtonElement>();
    for (const f of features) {
      if (!f.properties.micro || !f.properties.ISO2) continue;
      const b = document.createElement('button');
      b.className = 'marker';
      b.setAttribute('aria-label', f.properties.NAME);
      map.set(idOf(f), b);
    }
    return map;
  }, [features]);
  const microFeatures = useMemo(() => features.filter((f) => markers.has(idOf(f))), [features, markers]);

  // must be referentially stable: three-globe rebuilds every marker whenever the htmlElement prop changes identity
  const markerElement = useCallback((d: object) => markers.get(idOf(d as CountryFeature))!, [markers]);

  const latest = useRef({ onHover, select, features });
  latest.current = { onHover, select, features };
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    markers.forEach((b, id) => {
      const enter = () => latest.current.onHover(id);
      const leave = () => latest.current.onHover(null);
      const click = () => latest.current.select(latest.current.features.find((x) => idOf(x) === id));
      const ev: [string, () => void][] = [['mouseenter', enter], ['mouseleave', leave], ['focus', enter], ['blur', leave], ['click', click]];
      ev.forEach(([n, fn]) => b.addEventListener(n, fn));
      cleanups.push(() => ev.forEach(([n, fn]) => b.removeEventListener(n, fn)));
    });
    return () => cleanups.forEach((c) => c());
  }, [markers]);
  const colors = useMemo(() => regimeColors(regimes), [regimes]);
  const regimeMats = useMemo(() => new Map([...colors].map(([k, c]) => [k, createSolidMaterial(c)])), [colors]);
  useEffect(() => {
    markers.forEach((b, id) => {
      const regime = regimes.get(id);
      b.classList.toggle('has-content', layer === 'content' && contentIds.has(id));
      b.classList.toggle('is-hover', id === hoveredId);
      b.classList.toggle('is-selected', id === selectedId);
      // in the regime layer the marker takes the regime color unless hovered/selected (their CSS classes win)
      b.style.background = layer === 'regime' && regime && id !== hoveredId && id !== selectedId ? colors.get(regime) ?? '' : '';
    });
  }, [markers, contentIds, layer, regimes, colors, hoveredId, selectedId]);

  const lineObjects = useMemo(() => [buildLines(lines.borders, palette.border), buildLines(lines.coast, palette.coast)], [lines]);

  // Only the selected country's outline uses the (slow, per-object) paths layer, for its thicker stroke.
  const selectedRings = useMemo<PathDatum[]>(() => {
    const sel = features.find((f) => idOf(f) === selectedId);
    if (!sel) return [];
    const g = sel.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.flatMap((p) => p.map((ring) => ({ points: ring.map(([x, y]) => [x!, y!, ALT_SELECTED + 0.0005]) })));
  }, [features, selectedId]);

  // Hover/click picking without raycasting the polygon meshes (that cost ~15 ms/frame on an integrated GPU):
  // one cheap raycast against the globe sphere -> lat/lng -> bbox-filtered point-in-polygon.
  const bounds = useMemo(() => features.map((f) => geoBounds(f)), [features]);
  const pick = useCallback(
    (clientX: number, clientY: number): CountryFeature | undefined => {
      const rect = wrap.current?.getBoundingClientRect();
      const hit = rect && globe.current?.toGlobeCoords(clientX - rect.left, clientY - rect.top);
      if (!hit) return undefined;
      const pt: [number, number] = [hit.lng, hit.lat];
      return features.find((f, i) => {
        const [[w, s], [e, n]] = bounds[i]!;
        const inLng = w! <= e! ? pt[0] >= w! && pt[0] <= e! : pt[0] >= w! || pt[0] <= e!; // w > e = crosses antimeridian
        return inLng && pt[1] >= s! && pt[1] <= n! && geoContains(f, pt);
      });
    },
    [features, bounds],
  );

  const ptr = useRef({ down: false, moved: false, x: 0, y: 0, raf: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    ptr.current = { ...ptr.current, down: true, moved: false, x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = ptr.current;
    if ((e.target as HTMLElement).closest('.marker')) return; // markers drive their own hover
    if (p.down) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 4) p.moved = true;
      return; // no hover work while dragging
    }
    const { clientX, clientY } = e;
    cancelAnimationFrame(p.raf);
    p.raf = requestAnimationFrame(() => {
      const f = pick(clientX, clientY);
      onHover(f ? idOf(f) : null);
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = ptr.current;
    const wasClick = p.down && !p.moved;
    p.down = false;
    if (!wasClick || (e.target as HTMLElement).closest('.marker')) return;
    const f = pick(e.clientX, e.clientY);
    if (f) select(f);
    else onSelect(null);
  };

  const onReady = useCallback(() => {
    const g = globe.current;
    if (!g) return;
    g.pointOfView(START, 0);
    if (import.meta.env.DEV) (window as unknown as { __globe: GlobeMethods }).__globe = g; // for scripts/screenshot.ts
    const c = g.controls();
    c.autoRotate = false;
    c.enableDamping = true;
    c.dampingFactor = 0.1;
    c.minDistance = 100 * (1 + MIN_ALTITUDE); // GLOBE_RADIUS is 100 in three-globe
    c.maxDistance = 100 * (1 + 4);
    // programmatic camera moves don't fire 'change' by themselves; update() does, which re-hides far-side markers
    requestAnimationFrame(() => c.update());
  }, []);

  const capMaterial = useCallback(
    (d: object) => {
      const id = idOf(d as CountryFeature);
      const hov = id === hoveredId;
      const regime = regimes.get(id);
      const filled = layer === 'regime' ? !!regime : contentIds.has(id);
      if (!filled) return hov || id === selectedId ? mats.hatchHover : mats.hatch;
      if (id === selectedId) return mats.selected;
      if (hov) return mats.hover;
      return (layer === 'regime' && regime && regimeMats.get(regime)) || mats.content;
    },
    [contentIds, layer, regimes, regimeMats, hoveredId, selectedId, mats],
  );

  return (
    <div
      ref={wrap}
      className="globe-wrap"
      style={{ cursor: hoveredId ? 'pointer' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => onHover(null)}
    >
      <canvas ref={stars} className="stars" aria-hidden="true" style={{ width: size.w, height: size.h }} />
      <ReactGlobe
        ref={globe}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={mats.ocean}
        showAtmosphere
        atmosphereColor={palette.atmosphere}
        atmosphereAltitude={0.25}
        onGlobeReady={onReady}
        polygonsData={features}
        enablePointerInteraction={false}
        polygonCapMaterial={capMaterial}
        polygonSideColor={() => ''}
        polygonAltitude={(d) => (idOf(d as CountryFeature) === selectedId ? ALT_SELECTED : ALT_BASE)}
        polygonsTransitionDuration={0}
        pathsData={selectedRings}
        pathPoints="points"
        pathPointLat={(p) => (p as number[])[1]!}
        pathPointLng={(p) => (p as number[])[0]!}
        pathPointAlt={(p) => (p as number[])[2]!}
        pathColor={() => palette.creamSelected}
        pathStroke={0.12}
        customLayerData={lineObjects}
        customThreeObject={(d) => d as LineSegments}
        customThreeObjectUpdate={() => {}}
        pathTransitionDuration={0}
        pathResolution={2}
        htmlElementsData={microFeatures}
        htmlLat={(d) => (d as CountryFeature).properties.lat}
        htmlLng={(d) => (d as CountryFeature).properties.lng}
        htmlAltitude={0.01}
        htmlElement={markerElement}
        htmlElementVisibilityModifier={setMarkerVisible}
      />
    </div>
  );
}
