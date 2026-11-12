# 020 - Migração para Next.js App Router + tipos gerados do OpenAPI
Status: done | Contrato: não muda (v1.0 em produção, v1.1 local) | Decisão: [ADR-001](ADR-001-stack.md) (aprovado)

## Por quê
Rotas por hash e bundle único de 500 kB+ não servem às páginas de conteúdo que vêm (P4/P5): sem SEO, sem prévia de link,
sem divisão de código. E o contrato duplicado à mão (zod) deriva. Ver ADR-001.

## Requisitos (QUANDO ... ENTÃO ...)
- QUANDO abro `/` ENTÃO vejo o globo (como hoje).
- QUANDO abro `/pais/br` ENTÃO o globo abre com o Brasil selecionado e o painel; o HTML já vem com o painel renderizado
  no servidor e `<title>`/description/OG com nome e bandeira do país.
- QUANDO clico em outro país ENTÃO a URL vira `/pais/jp` sem recarregar a página e o globo NÃO é recriado (mesmo `<canvas>`).
- QUANDO clico no oceano / fecho o painel ENTÃO a URL volta para `/`.
- QUANDO abro `/glossario` ENTÃO o catálogo vem renderizado do servidor; o popup (`<dialog>`) dos termos continua no painel.
- QUANDO abro uma URL antiga `/#c=BR` ou `/#/glossario` ENTÃO sou redirecionado para `/pais/br` / `/glossario`.
- QUANDO `NEXT_PUBLIC_API_URL` não está definida ENTÃO o modo mock funciona como antes (selo "DADOS DE TESTE").
- QUANDO o OpenAPI da API muda e os schemas zod não acompanham ENTÃO `tsc` falha.

## Design
### Rotas (`app/`)
| Rota | Render | Conteúdo |
|---|---|---|
| `layout.tsx` (raiz) | servidor | `<html>` com tokens CSS (`cssVars()`), fontes `next/font/google` (Geist, Geist Mono), `styles.css`, `<Shell>` |
| `/` | estático | nada além do shell |
| `/pais/[iso2]` | SSG + ISR (`revalidate = 3600`), `generateStaticParams` = países de `GET /v1/countries` | `CountryRoute` (cliente) com o detalhe buscado no servidor; `generateMetadata` (título, description, OG com a bandeira) |
| `/glossario` | SSG + ISR | catálogo (`GlossaryPage`) com os termos buscados no servidor |

- **Shell** (`src/Shell.tsx`, client component no layout raiz): o antigo `App.tsx`. Fica montado entre rotas, então o globo
  (carregado com `next/dynamic`, `ssr: false`) nunca remonta. Renderiza `{children}` (o painel ou o catálogo) dentro do
  `GlossaryProvider`.
- **Estado**: `state.tsx` deixa de ler/escrever o hash. A seleção é derivada do caminho (`usePathname`); um clique atualiza a
  seleção na hora (otimista) e faz `router.push('/pais/xx', { scroll: false })` (navegação do App Router, sem recarregar).
  Em `/glossario` a seleção anterior fica embaixo (como antes); "Voltar ao globo" volta para ela.
- **Redirect do hash**: efeito no shell, ao montar: `#c=XX` -> `router.replace('/pais/xx')`, `#/glossario` -> `/glossario`.
  `y=` (ano) é descartado: não há slider ainda.
- **Painel**: `CountryPanel` ganha a prop opcional `initial` (detalhe vindo do servidor); sem ela busca no cliente como hoje.
  Se o servidor falhar (API fora do ar no build), a página sai sem `initial` e o cliente tenta de novo.
- **Ids sem ISO** (Somaliland etc., `idOf` = nome): `/pais/<nome>` resolve contra os polígonos sem diferenciar maiúsculas;
  a página mostra "Ainda não há dados".
- `public/data/` fica igual (servido em `/data/`).

### Env
`VITE_API_URL` -> `NEXT_PUBLIC_API_URL` (`.env.production` commitado, `.env.local`). Vazia/ausente = mocks, no servidor e no cliente.

### Tipos do OpenAPI
- `npm run api:types` (`scripts/api-types.ts`) gera `src/api/openapi.gen.ts` a partir de `../atlas-api/openapi.generated.json`
  ou, sem o arquivo irmão, de `https://atlas-api.fastapicloud.dev/openapi.json`. Arquivo gerado é commitado.
- Ferramenta: **openapi-typescript 6.7.6** (pinado). Por quê: só tipos (sem runtime), saída estável e legível, o padrão de fato.
  A 7.x usa a API JS do compilador TypeScript 5 (`ts.factory`), que o TypeScript 7 (nativo, em Go) deste repo não tem; a 6.x
  gera por strings, sem depender do `typescript`.
- Checagem de deriva: `src/api/contract-check.ts` compara, em tempo de compilação, `z.infer` de cada schema zod com o tipo
  gerado (igualdade de tipos, com os campos da v1.1 aceitos como opcionais enquanto a produção for v1.0). Mudou o OpenAPI e
  não o zod (ou o contrário): `tsc` quebra.

### Testes e scripts
- vitest continua (jsdom, alias `@/`), `vite.config.ts` some; `vitest.config.ts` força `NEXT_PUBLIC_API_URL=''`.
- `scripts/smoke.ts` e `scripts/screenshot.ts` usam rotas por caminho.
- `npm run build` = `next build` (o Next 16 roda o `tsc` local do projeto, compatível com TypeScript 7); `npm run typecheck` = só `tsc`.

### Vercel
`vercel.json` com `"framework": "nextjs"` (sobrescreve o preset "Vite" do painel) e saída padrão do Next.

## Tarefas
- [x] spec (este arquivo)
- [x] Next 16.4.6 + `app/` (layout, `/`, `/pais/[iso2]`, `/glossario`), shell com globo dinâmico, estado no caminho, redirect do hash
- [x] env `NEXT_PUBLIC_API_URL`, AGENTS.md, README
- [x] `npm run api:types` + arquivo gerado + checagem de deriva zod x OpenAPI
- [x] fontes `next/font/google`, tokens CSS no `<html>`
- [x] vitest sem Vite; scripts Playwright por caminho; remover Vite
- [x] `vercel.json`
- [x] build (tabela de rotas), typecheck, vitest, screenshots real + mock, `PLAN.md`

## Resultado
- Rotas: `○ /`, `○ /glossario` (ISR 1 h), `● /pais/[iso2]` (196 países da API pré-gerados, ISR 1 h; `dynamicParams` padrão:
  país novo é gerado na primeira visita). `generateMetadata`: título "Brasil · Atlas", description = resumo, OG/Twitter com a
  bandeira em PNG (flagcdn w640).
- Tamanho (gzip, medido nos `<script>` do HTML de cada rota): **First Load JS 236 kB** (774 kB sem compressão) em todas as rotas,
  contra o bundle único do Vite de **707 kB gzip / 2,5 MB**. O globo (three.js + react-globe.gl) virou um chunk à parte de
  552 kB gzip, carregado depois da hidratação; `/glossario` aberto direto não baixa o globo nem os mapas (2,4 MB de GeoJSON).
  As fixtures de mock (152 kB) só são carregadas em modo mock (import dinâmico).
- Contrato: `src/api/contract-check.ts` cobre 26 schemas; testado quebrando `Marker.lng` e `CountryDetail.clues` (tsc falhou nas
  linhas certas). `npm run api:types -- --check` acusa arquivo gerado desatualizado.
- Verificação (Playwright 1440x900, `scratchpad/p2/`): BR -> JP por clique no globo troca a URL para `/pais/jp`, mesmo `<canvas>`,
  sem recarregar; `/#c=BR` -> `/pais/br`; `/#/glossario` -> `/glossario`; diálogo do glossário abre; "Voltar ao globo" monta o
  globo; zero erros de console. vitest 34/34 (inclui `tests/routes.test.tsx`).
- Decisões: o seletor de ano (`y=` no hash) foi descartado (não havia slider). `window.__globe` fica exposto também em produção
  (os scripts de screenshot controlam a câmera por ele). O shell do glossário tem `GlossaryProvider` próprio com os termos e nomes
  vindos do servidor.

## Achados
- **A API cai com a rajada do build.** Os dois primeiros `next build` (6 workers x 8 páginas = ~48 chamadas simultâneas) deixaram
  `atlas-api.fastapicloud.dev` sem responder (até `/v1/health`, 524 do Cloudflare) por dezenas de minutos. Do lado do front:
  `experimental.cpus = 2` e `staticGenerationMaxConcurrency = 2` (4 chamadas em voo) e timeout de 10 s nas chamadas do servidor
  (página sai sem dados e o navegador busca de novo; API fora no build = nenhuma página de país pré-gerada, geradas sob demanda).
  Do lado da API (fora deste repo): investigar pool de conexões / workers; 50 GETs simultâneos não deveriam derrubá-la.
- Em modo mock, os exemplos do diálogo no `/glossario` mostram códigos (KP, LA) porque as fixtures só têm 9 países.

## Vercel
`vercel.json` com `"framework": "nextjs"` sobrescreve o preset do painel. No painel do projeto (Settings > Build and Deployment),
se estiverem com override: desligar o override de **Output Directory** (`dist`) e de **Build Command** / **Install Command**
(o padrão do Next usa `.next`). Settings > Environment Variables: se existir `VITE_API_URL` no painel, trocar por
`NEXT_PUBLIC_API_URL` (opcional: o valor já está no `.env.production` commitado). Node.js 20+ (já é o padrão).
