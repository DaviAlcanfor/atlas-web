# 020 - Migração para Next.js App Router + tipos gerados do OpenAPI
Status: in progress | Contrato: não muda (v1.0 em produção, v1.1 local) | Decisão: [ADR-001](ADR-001-stack.md) (aprovado)

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
- `npm run build` = `tsc --noEmit && next build`.

### Vercel
`vercel.json` com `"framework": "nextjs"` (sobrescreve o preset "Vite" do painel) e saída padrão do Next.

## Tarefas
- [ ] spec (este arquivo)
- [ ] Next 16.4.6 + `app/` (layout, `/`, `/pais/[iso2]`, `/glossario`), shell com globo dinâmico, estado no caminho, redirect do hash
- [ ] env `NEXT_PUBLIC_API_URL`, AGENTS.md, README
- [ ] `npm run api:types` + arquivo gerado + checagem de deriva zod x OpenAPI
- [ ] fontes `next/font/google`, tokens CSS no `<html>`
- [ ] vitest sem Vite; scripts Playwright por caminho; remover Vite
- [ ] `vercel.json`
- [ ] build (tabela de rotas), typecheck, vitest, screenshots real + mock, `PLAN.md`

## Resultado
(preenchido ao terminar)
