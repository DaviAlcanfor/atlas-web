# AGENTS.md — Atlas

Interactive 3D globe (country history, politics, facts) with a timeline slider that swaps to historical borders.
Stack: TypeScript (strict) + Vite + React (function components/hooks) + `react-globe.gl` + `zod` + `vitest`. Static site, not Next.js.

## Commands
- `npm run dev` — dev server (port 5173)
- `npm run build` — typecheck + production build
- `npm test` — vitest
- `npm run data` — ETL for geometry (`scripts/build-data.ts`)
- `npm run shot -- <out-dir>` — Playwright screenshots + drag frame-rate probe (needs dev server running; `HEADED=1 GPU=1` for real GPU)
- Windows note: the project path contains `&`, so `npx` fails; call tools via `node node_modules/<pkg>/...`.

## Data strategy (decision: external API, not local mocks)
We do **not** mock or hand-store all country data locally. Keeping everything in the repo does not scale
(hundreds of countries, facts that change, historical snapshots). Instead:

- **Facts** (names, capitals, flags, population, languages, currencies, leaders, memberships) come from an **external API**
  (REST Countries v5; World Bank as optional second source), fetched at runtime or build time, never invented.
- **Geometry** (Natural Earth via `world-atlas`, historical-basemaps snapshots) stays as static files in `public/data/`, because it is large, stable and not served by an API.
- **Curated text** (history timeline, "current politics") stays in `content/<ISO2>.json`, validated with zod. This is the only hand-written data.
- Missing field = "no data". Never fabricate values; mark uncertain curated content with `TODO`.
- Every fact block shows its source and "updated at".
- **API keys never ship to the browser.** If the API needs a key (REST Countries uses `RESTCOUNTRIES_API_KEY`), call it from a build script or a serverless proxy (e.g. Vercel function), not from client code. `.env` is git-ignored.
- The earlier plan (everything static from build-time JSON) is superseded where it conflicts with this section; the exact fetch layer (build-time vs. proxy + cache) is decided in phase 2 after checking the free-plan limits.

## Conventions
- Design tokens only in `src/lib/palette.ts` (mirrored to CSS variables). No hardcoded colors in components.
- State: `useState`/`useReducer` + one context (`selectedCountry`, `hoveredCountry`, `layer`, `year`); selection and year mirrored in the URL hash.
- Never use `dangerouslySetInnerHTML` for data from files or APIs.
- Pin exact dependency versions.
- Accessibility: keyboard-focusable controls, visible focus, respect `prefers-reduced-motion`, no horizontal scroll at 400px.

## Performance notes (globe)
- Hover/click picking uses `toGlobeCoords` + `d3-geo` point-in-polygon, not mesh raycasting (was ~15 ms/frame).
- Borders are two merged `LineSegments` (not the paths layer); `htmlElement` props must stay referentially stable.
- Hatch is a `ShaderMaterial` using `gl_FragCoord` (screen-space stripes).

## Phases
1. Globe matching the reference screenshots (in review)
2. Data fetching + facts in the panel
3. Historical layer + slider
4. Historical panel
5. Search + seed content + Vercel deploy
