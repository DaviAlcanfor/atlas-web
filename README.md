# Atlas

Globo 3D interativo onde cada país carrega história, política atual e fatos, e um slider de tempo troca o globo para fronteiras históricas (ex.: Império Otomano).

> **Status:** fase 1 de 5 (globo) entregue; fase 2 (API + mocks + painel) em andamento. Veja [TODO.md](TODO.md) para o que falta e [AGENTS.md](AGENTS.md) para as convenções do projeto.

## Stack
TypeScript (strict) · Next.js 16 (App Router) · React 19 (hooks) · `react-globe.gl` 2.38 (three-globe / three 0.187) · `zod` · `vitest` · Playwright (screenshots).
Rotas: `/` (globo), `/pais/br` (país, pré-gerado com ISR), `/glossario`. Ver [specs/020-nextjs.md](specs/020-nextjs.md).

## Como rodar
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # next build (inclui typecheck)
npm start          # servidor de produção em http://localhost:5173
npm run api:types  # regenera src/api/openapi.gen.ts a partir do OpenAPI da API
npm test           # vitest (testes ainda a escrever)
npm run data       # regenera public/data/ a partir do world-atlas
npm run shot -- <pasta>   # screenshots + medição de fps (precisa do dev server rodando)
```
Opções do `shot`: `HEADED=1 GPU=1` usa a GPU real em vez do renderizador por software.

> Windows: se o caminho do projeto tiver `&`, o `npx` falha. Chame as ferramentas por `node node_modules/<pacote>/...` (Next: `node node_modules/next/dist/bin/next`).

## Dados: três peças
| Peça | O que é | Onde |
|---|---|---|
| **Geometria** | Natural Earth 50m (via `world-atlas`), chaveada por ISO 3166-1 alpha-2. Kosovo = `XK` (não oficial). Historical-basemaps entra na fase 3. | `public/data/modern.geojson`, `lines.json` |
| **Dados** | Fatos, texto curado (história, política atual), vínculos de snapshots e busca vêm **somente da Atlas API** (repo separado; contrato em `contract/CONTRACT.md`). O app não chama REST Countries nem World Bank e não tem chaves. Sem `NEXT_PUBLIC_API_URL`, usa mocks em memória (`src/api/mocks/`). | `src/api/` |
| **Código** | App React + globo. | `src/` |

"País com conteúdo" (cor creme) e a posição dos marcadores de micro-estados vêm de `GET /v1/countries` (`has_content`, `marker`). Dado ausente = "no data"; nada é inventado.

Variável de ambiente: `NEXT_PUBLIC_API_URL` (ex.: `https://atlas-api.fastapicloud.dev`). A API precisa liberar a origem do app em `CORS_ORIGINS`.

### ETL (`scripts/build-data.ts`)
Converte `world-atlas/countries-50m` em:
- `modern.geojson` (~1,3 MB): polígonos com `ISO2`, `NAME`, `lat`, `lng`. Ilhas < ~400 km² são removidas dos polígonos para reduzir draw calls (permanecem nas linhas de costa).
- `lines.json` (~1,1 MB): fronteiras terrestres e costas separadas, para cores diferentes.
- Marcadores de micro-estados: posição vem da API (`marker`), não do ETL.

### Adicionar um país com conteúdo
Isso é feito no repo da API (o app só consome `has_content`).

### Adicionar um ano de snapshot histórico
Fase 3 (ainda não implementado).

## Estrutura
```
app/            rotas do Next (layout com o globo, /pais/[iso2], /glossario)
scripts/        build-data.ts, api-types.ts, screenshot.ts, smoke.ts
contract/       CONTRACT.md (congelado), CHANGE_REQUESTS.md
public/data/    modern.geojson, lines.json (e historical/ na fase 3)
src/
  api/          client, schemas zod, tipos (gerados do OpenAPI + checagem), mocks
  components/   Globe, InfoCard, CountryPanel, LayerToggle
  hooks/        useAtlasData, useAsync
  lib/          palette (tokens de design), hatchMaterial (shaders), stars
  Shell.tsx     o "chrome" no layout raiz: globo (next/dynamic, ssr: false), painel, glossário
  state.tsx     contexto único; seleção = caminho da URL (/pais/at); redireciona #c=AT antigo
```

## Visual
Tokens de cor em `src/lib/palette.ts` (espelhados como variáveis CSS), amostrados dos screenshots de referência. Terra sem conteúdo usa hachura diagonal em **espaço de tela** (shader com `gl_FragCoord`, densidade constante em qualquer zoom); com conteúdo, creme sólido. Estrelas são geradas proceduralmente (canvas).

## Limitações conhecidas
- Performance: ~30–40 fps ao arrastar num Intel Iris Xe (globo puro: 120 fps); ainda em investigação.
- Fronteiras disputadas (Kosovo, Taiwan, Crimeia): seguem o Natural Earth; a decisão por caso será documentada aqui.
- Bordas históricas (fase 3) serão aproximadas e os snapshots não são contínuos.
- Somaliland, N. Cyprus e outros territórios sem código ISO ficam sem conteúdo.

## Licenças e atribuição
- Natural Earth: domínio público. `world-atlas`: ISC.
- `historical-basemaps` (aourednik) é **GPL-3.0**; aviso e atribuição serão mantidos no repo e no rodapé do app quando for integrado (fase 3).
