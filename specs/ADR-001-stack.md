# ADR-001 - Stack para crescer: Next.js no front? Trocar o back?
Status: proposto (avaliação, nada refatorado) | Data: 2026-11-12

## Contexto
- Front: Vite + React SPA, rotas por hash (`#c=BR`), tudo renderizado no cliente; o globo é WebGL (three.js), só existe no navegador.
  O bundle já passa de 500 kB (aviso do Vite).
- Back: FastAPI (Python) só-leitura, Postgres (Supabase), ETL em Python (Wikidata, World Bank, Pantheon; em breve GDELT + Jev).
  Respostas cacheáveis (ETag + `Cache-Control: max-age=300`).
- Contrato escrito à mão e copiado nos dois repos; o front revalida com zod também escrito à mão.
- O que vem pela frente (specs 008-018): várias **páginas de conteúdo** (moeda, notícias, ideologias, glossário, perfil do país),
  um job agendado (notícias, câmbio) e muito mais ETL.

## Front: ficar no Vite ou ir para Next.js?
| Critério | Vite SPA (hoje) | Next.js (App Router) |
|---|---|---|
| Globo WebGL | nativo | igual, como client component (`dynamic(..., { ssr: false })`) |
| Páginas de conteúdo (notícias, moeda, ideias, país) | renderizadas no cliente; sem SEO, link compartilhado sem prévia | SSG/ISR: 196 páginas de país e páginas de moeda pré-geradas, revalidadas; OG image por país |
| URLs | hash (`#c=BR`) | caminhos reais (`/pais/br`, `/moeda/brl`) |
| Divisão de código | manual | por rota (resolve o bundle de 500 kB+ nas páginas sem globo) |
| Deploy | Vercel estático | Vercel nativo |
| Custo de migrar | 0 | ~2-3 dias: componentes React vão quase intactos; mudam roteamento, estado na URL, `fetch` nas páginas, config de testes |

**Recomendação: migrar para Next.js, e antes de construir as páginas novas** (moeda, notícias, ideias). Construir essas páginas no SPA
e depois portar é fazer o roteamento duas vezes. O globo e o painel passam quase sem mudança. Manter um redirect de `#c=XX` para `/pais/xx`.
Alternativas avaliadas: Vite + React Router + pré-render (Vike/vite-ssg) resolve SEO, mas reimplementa à mão o que o Next dá pronto;
TanStack Start é promissor, mas menos maduro na Vercel.

## Back: Python segura o crescimento?
Sim. A carga é só-leitura, pequena (MBs a poucos GBs) e muito cacheável; o gargalo vai ser banco e cold start, não a linguagem.
Python é a melhor escolha para o lado que mais cresce (ETL, dados abertos, Pantheon/WDI em CSV, SDK do TypeSafe/Jev).
Reescrever em Go/Node não compra nada mensurável aqui e custaria semanas.

O que de fato escala (em ordem de custo/benefício):
1. **CDN na frente da API** (as respostas já têm ETag/Cache-Control): com Next.js, ISR já cacheia na borda da Vercel.
2. **Corrigir `data_version`** (spec 019): hoje fatos novos não invalidam o cache.
3. **Índices e respostas pré-calculadas** para os endpoints pesados (perfil, economia, comparação): materializar no import, não na requisição.
4. **Separar serviço e workers** dentro do mesmo repo (já existe a separação de dependências `etl`); jobs no GitHub Actions até precisarem
   de frequência maior que horária.
5. **Pooler do Supabase** em modo sessão (já documentado) e, se o tráfego crescer, réplica de leitura.

## O atrito real: o contrato duplicado
Dois `CONTRACT.md` copiados à mão + zod à mão = deriva garantida conforme o contrato cresce (v1.2 adiciona ~12 endpoints).
**Recomendação:** gerar os tipos e schemas do front a partir de `openapi.generated.json` (ex.: `openapi-zod-client` ou
`openapi-typescript` + validação), com um teste de CI que falha se o OpenAPI mudar sem regenerar. Mais adiante, considerar monorepo
(`apps/web`, `apps/api`, `packages/contract`) para ter um contrato só; não é urgente.

## Decisão proposta
- Front: migrar para Next.js App Router antes das páginas novas (tarefa P2 do PLAN).
- Back: manter Python/FastAPI; aplicar os itens 1-5 conforme a necessidade.
- Contrato: tipos gerados do OpenAPI na mesma migração.
Nada disto foi implementado; aguarda o OK do dono para virar spec.
