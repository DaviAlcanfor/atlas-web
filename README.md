# Atlas

Globo 3D interativo onde cada país carrega história, política atual e fatos, e um slider de tempo troca o globo para fronteiras históricas (ex.: Império Otomano).

> **Status:** fase 1 de 5 (globo) entregue. Veja [TODO.md](TODO.md) para o que falta e [AGENTS.md](AGENTS.md) para as convenções do projeto.

## Stack
TypeScript (strict) · Vite · React 19 (hooks) · `react-globe.gl` 2.38 (three-globe / three 0.187) · `zod` · `vitest` · Playwright (screenshots). Site estático, sem Next.js.

## Como rodar
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de produção
npm test           # vitest (testes ainda a escrever)
npm run data       # regenera public/data/ a partir do world-atlas
npm run shot -- <pasta>   # screenshots + medição de fps (precisa do dev server rodando)
```
Opções do `shot`: `HEADED=1 GPU=1` usa a GPU real em vez do renderizador por software.

> Windows: se o caminho do projeto tiver `&`, o `npx` falha. Chame as ferramentas por `node node_modules/<pacote>/...`.

## Dados: três peças
| Peça | O que é | Onde |
|---|---|---|
| **Geometria** | Natural Earth 50m (via `world-atlas`), chaveada por ISO 3166-1 alpha-2. Kosovo = `XK` (não oficial). Historical-basemaps entra na fase 3. | `public/data/modern.geojson`, `lines.json` |
| **Dados** | Fatos (capital, população, idiomas, moeda…) vêm de **API externa** (REST Countries v5; World Bank opcional), não de mocks locais. Chaves nunca vão ao browser. | fase 2 (ver AGENTS.md) |
| **Código** | App React + globo. | `src/` |

Texto curado (história, política atual) fica em `content/<ISO2>.json`. Hoje há só 5 stubs (AT, BR, DE, EG, JP) com ISO2 e nome; presença do arquivo = país "com conteúdo" (cor creme). Dado ausente = "no data"; nada é inventado.

### ETL (`scripts/build-data.ts`)
Converte `world-atlas/countries-50m` em:
- `modern.geojson` (~1,3 MB): polígonos com `ISO2`, `NAME`, `micro`, `lat`, `lng`. Ilhas < ~400 km² são removidas dos polígonos para reduzir draw calls (permanecem nas linhas de costa).
- `lines.json` (~1,1 MB): fronteiras terrestres e costas separadas, para cores diferentes.
- Micro-estados soberanos (Andorra, Mônaco, Liechtenstein, San Marino, Vaticano, Malta etc.; lista fixa de 22) recebem marcador clicável no centroide.

### Adicionar um país com conteúdo
Crie `content/<ISO2>.json` (ex.: `content/IT.json` com `{ "iso2": "IT", "name": "Italy" }`). O schema zod completo (história, política) chega na fase 2.

### Adicionar um ano de snapshot histórico
Fase 3 (ainda não implementado).

## Estrutura
```
scripts/        build-data.ts, screenshot.ts
content/        <ISO2>.json (texto curado)
public/data/    modern.geojson, lines.json
src/
  components/   Globe, InfoCard
  hooks/        useAtlasData
  lib/          palette (tokens de design), hatchMaterial (shaders), stars
  state.tsx     contexto único + sincronização com o hash da URL (#c=AT)
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
