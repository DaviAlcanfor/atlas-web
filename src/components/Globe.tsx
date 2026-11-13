import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactGlobe, { type GlobeMethods } from 'react-globe.gl';
import { createDotMaterial, createDotOverlayMaterial, createOceanMaterial, DOT_SPACING, type DotShared } from '../lib/dotMaterial';
import { palette } from '../lib/palette';
import type { CapitalCoord } from '../api/types';
import { atlasTexture, createFlagMaterial, FLAG_LAYER_MIX, FLAG_MIX, flagBox, largestPolygon, loadFlag, loadFlagAtlas, loadImageAtlas } from '../lib/flagMaterial';
import { flagLargeUrl } from '../lib/url';
import { drawStars } from '../lib/stars';
import { geoArea, geoBounds, geoCentroid, geoCircle, geoContains } from 'd3-geo';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, type Object3D, type ShaderMaterial, type Texture } from 'three';
import { regimeColors } from '../lib/regimes';
import { STREETVIEW } from '../lib/streetview';
import type { Feature, FeatureCollection, Geometry, MultiLineString } from 'geojson';
import { idOf, type CountryFeature, type LayerId, type Lines } from '../types';

const ALT_BASE = 0.004;
const ALT_SELECTED = 0.008; // spec 023: less relief (was 0.015)
const ALT_LINE = 0.0042;
const ALT_ADMIN1 = ALT_SELECTED + 0.0003; // on the raised selected cap, under its outline
const ALT_STATE_HOVER = ALT_SELECTED + 0.0002; // hovered state overlay: just over the selected cap
const MIN_ALTITUDE = 0.15;
const START = { lat: 35, lng: -15, altitude: 0.92 }; // spec said altitude ~1.8; reference screenshot 2 measures ~0.92

interface PathDatum {
  points: number[][];
}

const GLOBE_RADIUS = 100; // three-globe constant
const INTRO_MS = 600;

// Dot looks per state (radius = fraction of the spacing). One material per state, shared by every country in it.
const DOTS = {
  dim: { color: palette.iceDim, radius: 0.24 }, // no content
  content: { color: palette.ice, radius: 0.3 },
  mid: { color: palette.iceMid, radius: 0.28 }, // GeoGuessr layer: restricted coverage
  hoverDim: { color: palette.iceBright, radius: 0.26 },
  hover: { color: palette.iceBright, radius: 0.32 },
  stateHover: { color: palette.iceBright, radius: 0.34, spacing: DOT_SPACING * 0.7 }, // same grid as `selected`: brightens its dots
  selected: { color: palette.iceBright, radius: 0.3, spacing: DOT_SPACING * 0.7 }, // denser + brighter (/2 goes sub-pixel at the default zoom)
  selectedDim: { color: palette.ice, radius: 0.28, spacing: DOT_SPACING * 0.7 },
};

/** Line color token -> three material params (three's Color ignores the alpha of rgba()). */
function lineParams(c: string) {
  const m = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(c);
  const opacity = m ? Number(m[4]) : 1;
  return { color: m ? `rgb(${m[1]}, ${m[2]}, ${m[3]})` : c, opacity, transparent: opacity < 1, depthWrite: opacity === 1 };
}
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
const SIGNAL_RGB = rgb(palette.signal);
const ringColor = () => (t: number) => `rgba(${SIGNAL_RGB}, ${1 - t * t})`;
interface RingDatum {
  lat: number;
  lng: number;
  r: number; // pulse max radius, degrees: past the border, where red reads on dark land
  n: number;
}
// 3 pulses, then stop: three-globe asks for the period once per emitted ring; <= 0 = no more rings.
const ringPeriod = (d: object) => (++(d as RingDatum).n < 3 ? 1100 : 0);
const ringRadius = (d: object) => (d as RingDatum).r;
const ringSpeed = (d: object) => (d as RingDatum).r / 1.6; // each pulse takes 1.6 s

// One merged LineSegments per line set = 1 draw call (the paths layer makes 1 object per line: ~1500, too slow).
// raycast is disabled: hover is handled by the polygons, and raycasting 100k line points per pointer move was costly.
function buildLines(paths: number[][][], color: string, alt = ALT_LINE): LineSegments {
  const pos: number[] = [];
  const r = GLOBE_RADIUS * (1 + alt);
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
  const mesh = new LineSegments(geo, new LineBasicMaterial(lineParams(color)));
  mesh.raycast = () => {};
  return mesh;
}

interface Props {
  features: CountryFeature[];
  lines: Lines;
  apiIds: Set<string>; // countries the API knows: active dots + flag requests (spec 014). Others stay dim.
  capitals: Map<string, CapitalCoord[]>; // iso2 -> capital coordinates (contract v1.1); the selected country's get a star (spec 005)
  layer: LayerId;
  regimes: Map<string, string>; // iso2 -> regime text (only countries where the API has one)
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onHoverState?: (s: StateRef | null) => void; // state/province under the pointer, inside the selected country (spec 005)
  selectedStateId?: string | null; // spec 024: clicked state (its wikidataid); its flag covers it
  onSelectState?: (s: StateRef | null) => void;
  stateFlags?: Map<string, string>; // spec 024: wikidataid -> flag image (API, Commons thumbnail) of the selected country's states
  showStates: boolean; // draw + hover the selected country's divisions (the "Estados" button)
  onReady?: () => void; // the globe has rendered its first frame (used to hide the loading screen)
  onFlagsLoading?: (loading: boolean) => void; // flag layer atlas is downloading (spec 014 part 2)
}

export interface StateRef {
  name: string; // polygon name (Natural Earth); the API's pt-BR name wins in the UI
  id: string | null; // wikidataid
}
type StateFeature = Feature<Geometry, { name: string; wikidataid?: string }>;

interface Admin1 {
  id: string; // country the data belongs to
  states: StateFeature[];
  bounds: ReturnType<typeof geoBounds>[];
  line: LineSegments | null; // one thin translucent light stroke (spec 023: the spec-021 double line read too thick)
}

/** bbox-filtered point-in-polygon; bounds[i] = geoBounds(items[i]). */
function findIn<T extends Feature>(items: T[], bounds: ReturnType<typeof geoBounds>[], pt: [number, number]): T | undefined {
  return items.find((f, i) => {
    const [[w, s], [e, n]] = bounds[i]!;
    const inLng = w! <= e! ? pt[0] >= w! && pt[0] <= e! : pt[0] >= w! || pt[0] <= e!; // w > e = crosses antimeridian
    return inLng && pt[1] >= s! && pt[1] <= n! && geoContains(f, pt);
  });
}

// html layer items: micro-state markers (CountryFeature) and the selected country's capital stars
interface CapitalDatum {
  el: HTMLElement;
  lat: number;
  lng: number;
}
const isCapital = (d: object): d is CapitalDatum => 'el' in d;

// module-level accessors: three-globe re-digests a layer whenever an accessor prop changes identity
const markerLat = (d: object) => (isCapital(d) ? d.lat : (d as CountryFeature).properties.lat);
const markerLng = (d: object) => (isCapital(d) ? d.lng : (d as CountryFeature).properties.lng);
const pathLat = (p: unknown) => (p as number[])[1]!;
const pathLng = (p: unknown) => (p as number[])[0]!;
const pathAlt = (p: unknown) => (p as number[])[2]!;
const pathColor = () => palette.iceBright;
const noSide = () => '';
const asObject = (d: object) => d as Object3D;
const noop = () => {};

/** 10° graticule sampled every 1° (d3's geoGraticule draws meridians as 90° chords, which cut through the globe). */
function graticule10(): number[][][] {
  const deg = (a: number, b: number, step: number) => Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => a + i * step);
  return [
    ...deg(-180, 170, 10).map((lng) => deg(-80, 80, 1).map((lat) => [lng, lat])),
    ...deg(-80, 80, 10).map((lat) => deg(-180, 180, 1).map((lng) => [lng, lat])),
  ];
}

const setMarkerVisible = (el: object, visible: boolean) => {
  (el as HTMLElement).style.visibility = visible ? '' : 'hidden'; // not display: CSS2DRenderer overwrites that
};
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Globe({ features, lines, apiIds, capitals, layer, regimes, hoveredId, selectedId, onHover, onSelect, onHoverState, selectedStateId, onSelectState, stateFlags, showStates, onReady: onReadyProp, onFlagsLoading }: Props) {
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

  const shared = useMemo<DotShared>(() => ({ intro: { value: 0 }, zoom: { value: 1 } }), []); // uniforms shared by every land material
  const mats = useMemo(
    () => ({
      ocean: createOceanMaterial(),
      dim: createDotMaterial(DOTS.dim, shared),
      content: createDotMaterial(DOTS.content, shared),
      mid: createDotMaterial(DOTS.mid, shared),
      hoverDim: createDotMaterial(DOTS.hoverDim, shared),
      hover: createDotMaterial(DOTS.hover, shared),
      selected: createDotMaterial(DOTS.selected, shared),
      selectedDim: createDotMaterial(DOTS.selectedDim, shared),
      flag: createFlagMaterial(DOTS.selected, shared),
      stateHover: createDotOverlayMaterial(DOTS.stateHover, shared),
    }),
    [shared],
  );
  const graticule = useMemo(() => buildLines(graticule10(), palette.grid), []);

  // Flag backdrop (spec 002): the selected country's flag, blended over its largest polygon. Any failure = no flag.
  const [flagId, setFlagId] = useState<string | null>(null); // country whose flag mats.flag currently holds
  useEffect(() => {
    setFlagId(null);
    const f = features.find((x) => idOf(x) === selectedId);
    const box = f && flagBox(f.geometry);
    const url = flagLargeUrl(selectedId);
    if (!url || !box) return;
    let live = true;
    let raf = 0;
    loadFlag(url)
      .then((tex) => {
        if (!live || !tex) return;
        const u = mats.flag.uniforms;
        u.uFlag!.value = tex;
        u.uBox!.value = box;
        const t0 = performance.now();
        const fade = () => {
          const k = reducedMotion() ? 1 : Math.min(1, (performance.now() - t0) / 300);
          u.uMix!.value = FLAG_MIX * k;
          if (k < 1) raf = requestAnimationFrame(fade);
        };
        fade();
        setFlagId(selectedId);
      })
      .catch(() => {});
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [selectedId, features, mats]);

  // Flag layer (spec 014 part 2): one atlas texture shared by one material per country (same program; only uBox/uCell differ).
  // Until the atlas is ready the layer looks like the default one. Leaving the layer disposes the texture and materials.
  const [flagMats, setFlagMats] = useState<Map<string, ShaderMaterial> | null>(null);
  useEffect(() => {
    if (layer !== 'flags') return;
    let live = true;
    let raf = 0;
    let tex: Texture | undefined;
    const made = new Map<string, ShaderMaterial>();
    onFlagsLoading?.(true);
    loadFlagAtlas(features.map(idOf).filter((id) => /^[A-Z]{2}$/.test(id))) // by ISO2, not the API list: flags survive an API outage
      .then(({ canvas, cells }) => {
        if (!live) return;
        tex = atlasTexture(canvas);
        const flag = { value: tex };
        const mix = { value: 0 }; // shared: one write fades every country in
        for (const f of features) {
          const id = idOf(f);
          const cell = cells.get(id);
          const box = cell && flagBox(f.geometry);
          if (!box) continue;
          const m = createFlagMaterial(DOTS.content, shared);
          Object.assign(m.uniforms, { uFlag: flag, uMix: mix });
          m.uniforms.uBox!.value = box;
          m.uniforms.uCell!.value = cell;
          made.set(id, m);
        }
        setFlagMats(made);
        const t0 = performance.now();
        const fade = () => {
          const k = reducedMotion() ? 1 : Math.min(1, (performance.now() - t0) / 300);
          mix.value = FLAG_LAYER_MIX * k;
          if (k < 1) raf = requestAnimationFrame(fade);
        };
        fade();
      })
      .catch(() => {})
      .finally(() => live && onFlagsLoading?.(false));
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      onFlagsLoading?.(false);
      setFlagMats(null);
      // after three-globe has swapped the caps back to the dot materials (a disposed texture still in use would be re-uploaded)
      setTimeout(() => {
        tex?.dispose();
        made.forEach((m) => m.dispose());
      }, 1000);
    };
  }, [layer, features, shared, onFlagsLoading]);

  // Camera flies to whatever becomes selected: a click, a marker, the URL path or a glossary example (spec 004).
  const select = useCallback((f: CountryFeature | undefined) => f && onSelect(idOf(f)), [onSelect]);
  const flyTo = useCallback(
    (id: string | null) => {
      const f = id ? features.find((x) => idOf(x) === id) : undefined;
      const g = globe.current;
      if (!f || !g) return;
      const ms = reducedMotion() ? 0 : 900;
      g.pointOfView({ lat: f.properties.lat, lng: f.properties.lng, altitude: 0.9 }, ms);
      if (!ms) requestAnimationFrame(() => g.controls().update());
    },
    [features],
  );
  useEffect(() => flyTo(selectedId), [selectedId, flyTo]);
  const initialFly = useRef(() => {}); // onReady resets the camera to START; a country already selected (URL path) must win
  initialFly.current = () => flyTo(selectedId);

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
  const markerElement = useCallback((d: object) => (isCapital(d) ? d.el : markers.get(idOf(d as CountryFeature))!), [markers]);

  // Capital star + label for the selected country (spec 005). Elements are built here, once per selection, so the htmlElement accessor stays stable.
  // Micro-states are skipped: their marker already sits on the capital.
  const capitalData = useMemo<CapitalDatum[]>(() => {
    if (!selectedId || markers.has(selectedId)) return [];
    return (capitals.get(selectedId) ?? []).map((c) => {
      const el = document.createElement('div');
      el.className = 'capital';
      const label = document.createElement('span');
      label.className = 'capital__label';
      label.textContent = c.name; // textContent: API text never becomes markup
      el.append(label);
      return { el, lat: c.lat, lng: c.lng };
    });
  }, [capitals, selectedId, markers]);
  const htmlData = useMemo(() => [...microFeatures, ...capitalData], [microFeatures, capitalData]);

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
  const regimeMats = useMemo(
    () => new Map([...colors].map(([k, c]) => [k, createDotMaterial({ color: c, radius: DOTS.content.radius }, shared)])),
    [colors, shared],
  );
  useEffect(() => {
    markers.forEach((b, id) => {
      const regime = regimes.get(id);
      const sv = STREETVIEW[id];
      b.classList.toggle('has-content', layer === 'geoguessr' ? sv === 'full' : layer !== 'regime' && apiIds.has(id));
      b.classList.toggle('is-partial', layer === 'geoguessr' && sv === 'partial');
      b.classList.toggle('is-hover', id === hoveredId);
      b.classList.toggle('is-selected', id === selectedId);
      // in the regime layer the marker takes the regime color unless hovered/selected (their CSS classes win)
      b.style.background = layer === 'regime' && regime && id !== hoveredId && id !== selectedId ? colors.get(regime) ?? '' : '';
    });
  }, [markers, apiIds, layer, regimes, colors, hoveredId, selectedId]);

  // States/provinces of the selected country (spec 005): lazy per-country file; missing file or any error = no internal borders.
  // Removing the LineSegments from customLayerData makes three-globe dispose its geometry and material.
  const [admin1, setAdmin1] = useState<Admin1 | null>(null);
  useEffect(() => {
    setAdmin1(null);
    if (!selectedId || !/^[A-Z]{2}$/.test(selectedId)) return;
    let live = true;
    fetch(`/data/admin1/${selectedId}.geojson`)
      .then((r) => (r.ok ? (r.json() as Promise<FeatureCollection<Geometry, { name?: string }>>) : null))
      .then((fc) => {
        if (!live || !fc) return;
        const states = fc.features.filter((f): f is StateFeature => !!f.properties?.name);
        const borders = fc.features.find((f): f is Feature<MultiLineString, { name?: string }> => f.geometry.type === 'MultiLineString');
        setAdmin1({
          id: selectedId,
          states,
          bounds: states.map((f) => geoBounds(f)),
          line: borders ? buildLines(borders.geometry.coordinates, palette.admin1Line, ALT_ADMIN1) : null,
        });
      })
      .catch(() => {}); // e.g. dev server answering index.html for a missing file
    return () => {
      live = false;
    };
  }, [selectedId]);

  const [hoverState, setHoverState] = useState<Admin1['states'][number] | null>(null);
  useEffect(() => setHoverState(null), [selectedId, showStates]);

  const baseLines = useMemo(
    () => [graticule, buildLines(lines.borders, palette.border), buildLines(lines.coast, palette.coast)],
    [lines, graticule],
  );

  // Selection pulse (spec 013): 3 signal-red rings from the mainland's centroid (FR's centroid is in the Atlantic because of
  // French Guiana), sized to it. Reduced motion: one static ring.
  const selectedFeature = useMemo(() => features.find((f) => idOf(f) === selectedId), [features, selectedId]);
  const ring = useMemo<RingDatum | null>(() => {
    const main = selectedFeature && largestPolygon(selectedFeature.geometry);
    if (!main) return null;
    const eqRadius = (Math.sqrt(geoArea(main) / Math.PI) * 180) / Math.PI; // radius of an equal-area disc, degrees
    const [lng, lat] = geoCentroid(main);
    return { lat, lng, r: Math.min(12, Math.max(2, eqRadius * 1.2)), n: 0 };
  }, [selectedFeature]);
  const reduced = reducedMotion();
  const ringsData = useMemo(() => (ring && !reduced ? [ring] : []), [ring, reduced]);
  const staticRing = useMemo(() => {
    if (!ring || !reduced) return null;
    const c = geoCircle().center([ring.lng, ring.lat]).radius(ring.r * 0.6)();
    return buildLines(c.coordinates, palette.signal, ALT_SELECTED + 0.001);
  }, [ring, reduced]);

  // outline of the hovered state, bright, so it reads even where the fill overlay has little to lighten (white flag stripes)
  const stateOutline = useMemo(() => {
    const g = hoverState?.geometry;
    const polys = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.length ? buildLines(polys.flat(), palette.iceBright, ALT_STATE_HOVER + 0.0003) : null;
  }, [hoverState]);
  const lineObjects = useMemo(
    () => [...baseLines, ...(showStates && admin1?.line ? [admin1.line] : []), ...(stateOutline ? [stateOutline] : []), ...(staticRing ? [staticRing] : [])],
    [baseLines, admin1, showStates, stateOutline, staticRing],
  );

  // Only the selected country's outline uses the (slow, per-object) paths layer, for its thicker stroke.
  const selectedRings = useMemo<PathDatum[]>(() => {
    if (!selectedFeature) return [];
    const g = selectedFeature.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    return polys.flatMap((p) => p.map((ring) => ({ points: ring.map(([x, y]) => [x!, y!, ALT_SELECTED + 0.0005]) })));
  }, [selectedFeature]);

  // Hover/click picking without raycasting the polygon meshes (that cost ~15 ms/frame on an integrated GPU):
  // one cheap raycast against the globe sphere -> lat/lng -> bbox-filtered point-in-polygon.
  const bounds = useMemo(() => features.map((f) => geoBounds(f)), [features]);
  const pointAt = (clientX: number, clientY: number): [number, number] | undefined => {
    const rect = wrap.current?.getBoundingClientRect();
    const hit = rect && globe.current?.toGlobeCoords(clientX - rect.left, clientY - rect.top);
    return hit ? [hit.lng, hit.lat] : undefined;
  };

  // spec 024: the selected state is drawn as an extra polygon over the country, with its flag once loaded (else the hover look)
  const selState = useMemo(
    () => (showStates && selectedStateId ? admin1?.states.find((s) => s.properties.wikidataid === selectedStateId) : undefined),
    [admin1, showStates, selectedStateId],
  );
  // spec 024: with "Estados" on, every state that has a flag is drawn with it: one atlas per country (same technique as the flag
  // layer), one material per state. States without a flag keep showing the country's flag underneath.
  const [stateMats, setStateMats] = useState<Map<string, ShaderMaterial> | null>(null);
  useEffect(() => {
    setStateMats(null);
    if (!showStates || !admin1 || !stateFlags?.size) return;
    let live = true;
    let raf = 0;
    let tex: Texture | undefined;
    const made = new Map<string, ShaderMaterial>();
    const items = admin1.states.flatMap((st): [string, string][] => {
      const id = st.properties.wikidataid;
      const url = id && stateFlags.get(id);
      return id && url ? [[id, url]] : [];
    });
    loadImageAtlas(items)
      .then(({ canvas, cells }) => {
        if (!live) return;
        tex = atlasTexture(canvas);
        const flag = { value: tex };
        const mix = { value: 0 }; // shared: one write fades every state in
        for (const st of admin1.states) {
          const id = st.properties.wikidataid;
          const cell = id ? cells.get(id) : undefined;
          const box = cell && flagBox(st.geometry);
          if (!id || !cell || !box) continue;
          const m = createFlagMaterial(DOTS.content, shared);
          Object.assign(m.uniforms, { uFlag: flag, uMix: mix });
          m.uniforms.uBox!.value = box;
          m.uniforms.uCell!.value = cell;
          made.set(id, m);
        }
        setStateMats(made);
        const t0 = performance.now();
        const fade = () => {
          const k = reducedMotion() ? 1 : Math.min(1, (performance.now() - t0) / 300);
          mix.value = FLAG_MIX * k;
          if (k < 1) raf = requestAnimationFrame(fade);
        };
        fade();
      })
      .catch(() => {}); // no atlas = states keep the plain look
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      setTimeout(() => { // after three-globe dropped the meshes using them
        tex?.dispose();
        made.forEach((m) => m.dispose());
      }, 1000);
    };
  }, [showStates, admin1, stateFlags, shared]);
  const stateMat = useCallback((d: object) => stateMats?.get((d as StateFeature).properties.wikidataid ?? ''), [stateMats]);

  const polygons = useMemo(() => {
    const extra = (admin1?.states ?? []).filter((st) => stateMats?.has(st.properties.wikidataid ?? ''));
    for (const st of [selState, hoverState]) if (st && !extra.includes(st)) extra.push(st);
    return extra.length ? [...features, ...(extra as unknown as CountryFeature[])] : features;
  }, [features, admin1, stateMats, hoverState, selState]);

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
      const pt = pointAt(clientX, clientY);
      const f = pt && findIn(features, bounds, pt);
      onHover(f ? idOf(f) : null);
      const st = showStates && pt && f && admin1 && admin1.id === idOf(f) ? findIn(admin1.states, admin1.bounds, pt) : undefined;
      setHoverState((prev) => (prev === st ? prev : st ?? null));
      onHoverState?.(st ? { name: st.properties.name, id: st.properties.wikidataid ?? null } : null);
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = ptr.current;
    const wasClick = p.down && !p.moved;
    p.down = false;
    if (!wasClick || (e.target as HTMLElement).closest('.marker')) return;
    const pt = pointAt(e.clientX, e.clientY);
    const f = pt && findIn(features, bounds, pt);
    const st = showStates && pt && f && admin1 && admin1.id === idOf(f) && idOf(f) === selectedId ? findIn(admin1.states, admin1.bounds, pt) : undefined;
    if (st) onSelectState?.({ name: st.properties.name, id: st.properties.wikidataid ?? null }); // spec 024
    else if (f) select(f);
    else onSelect(null);
  };

  const onReady = useCallback(() => {
    const g = globe.current;
    if (!g) return;
    g.pointOfView(START, 0);
    initialFly.current();
    (window as unknown as { __globe: GlobeMethods }).__globe = g; // for scripts/screenshot.ts (camera control in production builds too)
    const c = g.controls();
    c.autoRotate = false;
    c.enableDamping = true;
    c.dampingFactor = 0.1;
    c.minDistance = 100 * (1 + MIN_ALTITUDE); // GLOBE_RADIUS is 100 in three-globe
    c.maxDistance = 100 * (1 + 4);
    // zoom LOD: dot spacing halves per zoom octave so dots keep ~the same size on screen (a whole-globe switch, no seams)
    const relevel = () => {
      shared.zoom.value = Math.min(1, 2 ** Math.round(Math.log2(g.pointOfView().altitude / START.altitude)));
    };
    c.addEventListener('change', relevel);
    relevel();
    // programmatic camera moves don't fire 'change' by themselves; update() does, which re-hides far-side markers
    requestAnimationFrame(() => {
      c.update();
      onReadyProp?.();
    });
    // entry: dots light up and the graticule fades in
    const gratMat = graticule.material as LineBasicMaterial;
    const gratOpacity = lineParams(palette.grid).opacity;
    const t0 = performance.now();
    const step = () => {
      const k = reducedMotion() ? 1 : Math.min(1, (performance.now() - t0) / INTRO_MS);
      shared.intro.value = 1 - (1 - k) ** 3; // ease-out
      gratMat.opacity = gratOpacity * k;
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  }, [onReadyProp, shared, graticule]);

  const capMaterial = useCallback(
    (d: object) => {
      const sm = stateMat(d);
      if (sm) {
        sm.uniforms.uDot!.value.set(d === hoverState || d === selState ? DOTS.hover.color : DOTS.content.color);
        return sm;
      }
      if (d === selState || d === hoverState) return mats.stateHover;
      const id = idOf(d as CountryFeature);
      const hov = id === hoveredId;
      const regime = regimes.get(id);
      const sv = layer === 'geoguessr' ? STREETVIEW[id] : undefined;
      const filled = layer === 'regime' ? !!regime : layer === 'geoguessr' ? !!sv : apiIds.has(id);
      if (id === selectedId && id === flagId) {
        mats.flag.uniforms.uDot!.value.set(filled ? DOTS.selected.color : DOTS.selectedDim.color);
        return mats.flag;
      }
      const fm = layer === 'flags' ? flagMats?.get(id) : undefined;
      if (fm) {
        fm.uniforms.uDot!.value.set(hov || id === selectedId ? DOTS.hover.color : DOTS.content.color);
        return fm; // also the selected country while its spec-002 flag (w640) loads
      }
      if (id === selectedId) return filled ? mats.selected : mats.selectedDim;
      if (!filled) return hov ? mats.hoverDim : mats.dim;
      if (hov) return mats.hover;
      if (sv === 'partial') return mats.mid;
      return (layer === 'regime' && regime && regimeMats.get(regime)) || mats.content;
    },
    [apiIds, layer, regimes, regimeMats, hoveredId, selectedId, flagId, mats, flagMats, hoverState, selState, stateMat],
  );

  const polygonAltitude = useCallback(
    (d: object) =>
      d === hoverState || d === selState || stateMat(d) ? ALT_STATE_HOVER : idOf(d as CountryFeature) === selectedId ? ALT_SELECTED : ALT_BASE,
    [selectedId, hoverState, selState, stateMat],
  );

  return (
    <div
      ref={wrap}
      className="globe-wrap"
      style={{ cursor: hoveredId ? 'pointer' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        onHover(null);
        setHoverState(null);
        onHoverState?.(null);
      }}
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
        atmosphereAltitude={0.12}
        onGlobeReady={onReady}
        polygonsData={polygons}
        enablePointerInteraction={false}
        polygonCapMaterial={capMaterial}
        polygonSideColor={noSide}
        polygonAltitude={polygonAltitude}
        polygonsTransitionDuration={0}
        pathsData={selectedRings}
        pathPoints="points"
        pathPointLat={pathLat}
        pathPointLng={pathLng}
        pathPointAlt={pathAlt}
        pathColor={pathColor}
        pathStroke={0.12}
        customLayerData={lineObjects}
        customThreeObject={asObject}
        customThreeObjectUpdate={noop}
        pathTransitionDuration={0}
        pathResolution={2}
        htmlElementsData={htmlData}
        htmlLat={markerLat}
        htmlLng={markerLng}
        htmlAltitude={0.01}
        htmlElement={markerElement}
        htmlElementVisibilityModifier={setMarkerVisible}
        ringsData={ringsData}
        ringAltitude={ALT_SELECTED + 0.001}
        ringColor={ringColor}
        ringMaxRadius={ringRadius}
        ringPropagationSpeed={ringSpeed}
        ringRepeatPeriod={ringPeriod}
        ringResolution={96}
      />
    </div>
  );
}
