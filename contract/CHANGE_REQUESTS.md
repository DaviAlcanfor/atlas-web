# Change requests (web -> contract owner)

## CR-1: contract copy is v1.0, expected v1.1; `indicators` missing
- **What:** The `contract/CONTRACT.md` I received says `Version: 1.0`. The brief said v1.1 and asks the country panel to show `indicators` (label, value, unit, year, source). The v1.0 `CountryDetail` has no `indicators` field (also absent from the pasted OpenAPI).
- **Why it matters:** I cannot write zod schemas or mock fixtures for a field the contract does not define, and I will not guess its shape.
- **Proposed fix:** Provide the real v1.1 CONTRACT.md (and a matching openapi.generated.json). If v1.1 does not exist yet, the API owner should add `indicators` to `CountryDetail` (suggested: `{ id, label, value: number, unit: string|null, year: int|null, source_id: string }[]`).
- **Status:** resolved by the user on 2026-11-11: the live API (https://atlas-api.fastapicloud.dev, OpenAPI 1.0) is the base and has no `indicators` either. Web builds against v1.0; indicators stay out of the panel until the API adds them.

## Live API vs contract (observed 2026-11-11, for phase 4; not patched in the UI)
- CORS: preflight from `http://localhost:5173` returns 400 with no `access-control-allow-origin`. Fix belongs in the API's `CORS_ORIGINS`.
- `/v1/meta` response has no `ETag`, `Cache-Control` or `X-Data-Version` headers (contract says every response carries them).
- Data is still stubbed: `data_version: "stub-0"`, 8 countries, snapshots 1815/1914/1945 only, `regime` is null in `/v1/countries`.
- Matches contract: schema names/fields, `/v1/snapshots/nearest` shape, 404 as `application/problem+json`.

## Phase 4 integration check (2026-11-11, CORS now open)
- All endpoints validate against the web zod schemas (countries, 8x country, nearest, 3x links, 9x polity, search). Errors arrive as problem+json (404, 422).
- Still open on the API: no `ETag` / `Cache-Control` / `X-Data-Version` on /v1/countries, /v1/meta, /v1/snapshots, /v1/polities/{id}.
- Data is still stub: `regime` null everywhere, country detail has 1 stub event, no languages/currencies/population, `flag_url` null.
- `/v1/snapshots/nearest?year=3000` -> 422 "year must be between -3000 and 2025" (matches meta year_min/year_max; web must treat as "year out of range").
- Geometry files `/data/historical/world_<year>.geojson` are not in this repo yet (needed for phase 3).

## API update check (2026-11-11, 196 countries live)
- Fixed on the API side since last check: `ETag`, `Cache-Control`, `X-Data-Version` are now present.
- All 196 `/v1/countries/{iso2}` responses validate against the web schemas. 22 markers, 5 `has_content`, 5 with `regime`.
- `GET /v1/snapshots/nearest` now returns 404 "No snapshots available yet" while `snapshot_years` is empty (web handles it via `isNotFound`; UI in phase 3).
- Data quality (API side, not patched in UI): FR `currencies` lists "franco CFP (₣)" next to the euro (Wikidata value for overseas territories); the 5 seed countries' 23 events all have `source_ids: []`; regime text comes from an unverified legacy seed.

## CR-2: news per country (requested by the user, 2026-11-11)
- **What:** the web panel needs a "Notícias" (news) section. Contract v1.0 has no news endpoint, and the web app may only consume the Atlas API.
- **Today (web):** the section states that the API has no news yet and links out to a Google News search for the country (a link only; nothing is fetched or invented).
- **Proposed fix:** `GET /v1/countries/{iso2}/news?limit=` -> `{ items: [{ id, title, url, source_name, published_at, language }] }`, fetched/cached server side (keys stay on the API).
- **Status:** open.
