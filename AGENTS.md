# AGENTS.md — Atlas

Interactive 3D globe (country history, politics, facts) with a timeline slider that swaps to historical borders.
Stack: TypeScript (strict) + Vite + React (function components/hooks) + `react-globe.gl` + `zod` + `vitest`. Static site, not Next.js.

## Commands
- `npm run dev` — dev server (port 5173)
- `npm run build` — typecheck + production build
- `npm test` — vitest
- `npm run data` — ETL for modern geometry (`scripts/build-data.ts`)
- `npm run smoke [-- <url>]` — headless check of a deployed build (default: production): API OK, no error banner, no console errors
- `npm run shot -- <out-dir>` — Playwright screenshots + drag frame-rate probe (needs dev server running; `HEADED=1 GPU=1` for real GPU)
- Windows note: the project path contains `&`, so `npx` fails; call tools via `node node_modules/<pkg>/...`.
  `vitest` additionally crashes ("reading 'config'") when run from a path containing `&`: run it through a junction, e.g. `mklink /J %TEMP%\atlasjunc "<project path>"` and `cd` there.

## Data strategy (decision: the web app talks ONLY to the Atlas API)
The API is a separate repo ("atlas-api"). Its contract is `contract/CONTRACT.md` (FROZEN: never edit it; problems go to
`contract/CHANGE_REQUESTS.md`, then stop and tell the user). Live: https://atlas-api.fastapicloud.dev (docs at `/docs`).

- **Facts, curated timeline/politics, snapshot links, search**: only from the Atlas API. The web app does NOT call REST Countries,
  World Bank or Wikidata (browser or build time) and holds no API keys.
- **Geometry** is static under `public/data/`. MODERN geometry is built by this repo (`scripts/build-data.ts`, Natural Earth via `world-atlas`).
  HISTORICAL geometry (historical-basemaps) is copied by the user into `public/data/historical/`; paths come from the API's `geometry_url`.
- **"Has content" and micro-state marker positions** come from `GET /v1/countries` (`has_content`, `marker`), not from local files.
  There is no `content/` folder in the web app.
- Missing field = "no data". Never fabricate values.
- Every fact block shows its source (from `sources`) and "updated at".
- Client: `src/api/client.ts` (fetch, `application/problem+json` errors, browser HTTP/ETag cache left on) + zod validation of every response.
  `VITE_API_URL` (public URL, not a secret) is committed in `.env.production` so Vercel builds hit the real API; `.env.local` for dev.
  Mock mode: if `VITE_API_URL` is unset, an in-memory adapter (`src/api/mocks/`) returns fixtures that conform to the contract. Same components either way.
- CORS blocked by the API? Do not work around it in the web app: report it (the fix is the API's `CORS_ORIGINS`).

## Conventions
- Design tokens only in `src/lib/palette.ts` (mirrored to CSS variables). No hardcoded colors in components.
- State: `useState`/`useReducer` + one context (`selectedCountry`, `hoveredCountry`, `layer`, `year`); selection and year mirrored in the URL hash.
- Never use `dangerouslySetInnerHTML` for data from files or APIs.
- Pin exact dependency versions.
- Accessibility: keyboard-focusable controls, visible focus, respect `prefers-reduced-motion`, no horizontal scroll at 400px.

## Performance notes (globe)
- Hover/click picking uses `toGlobeCoords` + `d3-geo` point-in-polygon, not mesh raycasting (was ~15 ms/frame).
- Borders are two merged `LineSegments` (not the paths layer); `htmlElement` props must stay referentially stable.
- Land is a dot-matrix `ShaderMaterial` (`src/lib/dotMaterial.ts`) laid out in lat/lng; one material per state, shared `uIntro`/`uZoom` uniforms.
- `ReactGlobe` accessor props must be stable (module-level or `useCallback`): a new function identity re-digests the layer.

## Specs (spec-driven)
New features start in `specs/NNN-slug.md` (index + template: `specs/README.md`), numbered like the API repo's `specs/` so both halves match.
Status: draft -> approved (only the user approves) -> in progress -> done. No feature code for a `draft` spec.
New API fields are used only after the contract is updated; until then build on mock fixtures shaped like the spec's "Contract delta".

## Production
Vercel: https://atlas-web-ruddy.vercel.app (API: https://atlas-api.fastapicloud.dev). A new front domain must be added to the API's
`CORS_ORIGINS` on FastAPI Cloud (see the API repo's AGENTS.md); "Failed to fetch" with 200s in the API log = CORS.
After each deploy: `npm run smoke`.

## Phases
1. Globe matching the reference screenshots (in review)
2. API client + mock mode + country panel + layer toggle
3. Historical layer + slider + historical panel (on mocks)
4. Integration with the live API (list every contract mismatch)
5. Search + approved leftovers + polish + Vercel deploy
