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
- **Superseded (2026-11-11)** by the workspace spec `../specs/008-news.md`.

## Production CORS (2026-11-11)
- Vercel (https://atlas-web-ruddy.vercel.app) was blocked: API `CORS_ORIGINS` held only localhost. Added on FastAPI Cloud; verified with `npm run smoke`.

## CR-004 (contract v1.3) applied 2026-11-13
The owner approved everything pending (spec 026); CR-004 and its addenda 1-4 (history, subdivisions, history events, political
currents, `Subdivision.area_codes`) are now in `CONTRACT.md` (identical in both repos). Full CR text: atlas-api `contract/CHANGE_REQUESTS.md`.

## CR-005 (2026-11-13): historical snapshots from Cliopatria (spec 012 stage 1)
Proposed in atlas-api `contract/CHANGE_REQUESTS.md` (full text there): `geometry_url` stays relative to this repo's origin
(`/data/historical/world_<year>.geojson`, 130 files committed under `public/`), GeoJSON with properties
`{ name, name_en, wikidata, from_year, to_year, member_of, wikipedia_url }`, `meta.year_min` = -3400. The web already reads it.

## CR-009: what the economy lives on (spec 029 phase 1, 2026-11-15; owner: "aprovado tudo")
**Applied 2026-11-17 as contract v1.7** (owner: "cola vc logo isso no que precisa").
Additive. One more profile group; nothing else changes.
```
ProfileGroup.id: "life"|"society"|"income"|"environment"|"economy"
GET /v1/countries/{iso2}/profile -> Always the 5 groups, in this order. "economy" = NV.AGR.TOTL.ZS, NV.IND.TOTL.ZS,
     NV.IND.MANF.ZS, NV.SRV.TOTL.ZS (% of GDP), NY.GDP.PETR.RT.ZS, NY.GDP.TOTL.RT.ZS (rents, % of GDP),
     TX.VAL.FUEL.ZS.UN, TX.VAL.FOOD.ZS.UN, TX.VAL.AGRI.ZS.UN, TX.VAL.MMTL.ZS.UN, TX.VAL.MANF.ZS.UN
     (% of merchandise exports), TX.VAL.TECH.MF.ZS (% of manufactured exports). Same ProfileIndicator shape and rules
     (no data for the country = the indicator is left out of the group).
```
Source: World Bank WDI (CC BY 4.0), same ETL as the other indicators. The same 12 ids also show up in `GET /v1/indicators`
(the catalog already lists every ranked indicator with data, so that part needs no contract text).
**Deploy order**: clients validate `ProfileGroup.id` as a closed enum, so the web must accept "economy" BEFORE the API serves it.

## CR-010: what a country exports and who it trades with (spec 029 phase 2, 2026-11-16; owner: "aprovado tudo" 2026-11-15)
**Applied 2026-11-17 as contract v1.8** (owner: "cola vc logo isso no que precisa").
Additive, one read-only endpoint:
```
TradeProduct    { hs: string /* HS 2022 heading, 4 digits */, label: string /* pt-BR, verbatim */,
                  value_usd: number, share: number /* of exports_usd, 0..1 */ }
TradePartner    { iso2: string, value_usd: number, share: number /* of exports_usd (destinations) or imports_usd (origins), 0..1 */ }
CountryTradeOut { year: int, exports_usd: number, imports_usd: number /* goods only, current USD */,
                  top_exports: TradeProduct[] /* up to 10, by value */,
                  top_destinations: TradePartner[] /* up to 10, by value */,
                  top_origins: TradePartner[] /* up to 10, by value */, sources: Source[] }
GET /v1/countries/{iso2}/trade -> CountryTradeOut      Unknown iso2 -> 404; no BACI data for the country -> 404.
```
Data: CEPII BACI version 202601, HS 2022, latest year (2024), summed per HS 4 digits and per partner by the ETL (`etl baci`,
written by `import-trade`). Partners may be ISO2 codes that are not countries of `/v1/countries` (e.g. HK); BACI groups with no
ISO2 ("Other Asia, nes", which is how BACI reports Taiwan) count in the totals but are never listed, so TW -> 404.
Sources (both always present): `baci` (licence "Etalab 2.0"), title "CEPII, BACI (versão 202601, atualizada em 30/01/2026);
HS 2022, agregado por Atlas", and `mdic-sh` (licence "CC BY-ND 3.0"), MDIC/Secex NCM_SH table for the pt-BR headings.
Clients must show the BACI attribution with its version and update date (Etalab 2.0 requires "the name of the 'Grantor' and the
date of the most recent update") and must show `label` VERBATIM (CC BY-ND: no shortening or rewording in the text; visual
truncation with the full text available, e.g. a tooltip, is the client's call to confirm with the owner).
