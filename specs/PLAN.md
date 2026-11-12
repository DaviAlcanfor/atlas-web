# Plano de execução (2026-11-12)

Planejado com Fable/Opus, executado por Opus/Sonnet. Cada tarefa aponta para a spec (fonte da verdade) e diz quem executa.
Specs do web: `specs/NNN-*.md` deste repo. Specs da API: `atlas-api/specs/NNN-*.md`. Mesmo número = mesma feature.
**Regras para quem executa:** ler o `AGENTS.md` do repo e a spec antes de codar; API antes do web; contrato só muda com CR aprovada
(o dono aprovou a v1.2 em bloco: aplicar no `CONTRACT.md` dos dois repos no início da fase que a usar); terminar cada tarefa com
testes + screenshots (web) e marcar os checkboxes da spec. Um subagente por repo quando a tarefa cruza os dois.

## Checklist dos pedidos

### Lista 1 (2026-11-11)
| Pedido | Spec | API | Web | Situação |
|---|---|---|---|---|
| Como funciona o governo, não só o nome | 004 | feito (glossário, 21 verbetes rascunho) | feito em mocks (P1) | P1 feito; vale em produção após P0 |
| Popup com explicação + catálogo de todos os termos | 004 | feito (`/v1/glossary`) | feito em mocks (P1) | P1 feito; vale em produção após P0 |
| Moeda: página para comparar com dólar etc. | 009 | falta | falta | P4 (ampliado com economia) |
| Estados dos países / capital no mapa | 005 | capital feito | estados e capital feitos (capital em mocks) | P1 feito |
| Ícone para regime, moeda, região etc. | 004/013 | n/a | feito | pronto |
| Timeline estilizada em linha | 001 | n/a | feito | pronto |
| Pessoas importantes | 007 | feito (Pantheon, 196 países) | feito em mocks (P1) | P1 feito; vale em produção após P0 |
| Aba música | 010 | falta | falta | P6 |
| Tooltip/hover explicando cada info | 004 | feito | feito em mocks (P1) | P1 feito; vale em produção após P0 |
| Slider político esquerda-direita | 006 v1.2 | falta (fonte: V-Party + ParlGov) | falta | P5 |
| Histórico de governantes | 006 | feito (10.645 mandatos) | feito em mocks (P1) | P1 feito; vale em produção após P0 |
| Vídeos de história no YouTube | 011 | falta | falta | P6 |

### Lista 2 (2026-11-12)
| Pedido | Spec | Situação |
|---|---|---|
| Todos os países com cara de clicáveis + bandeiras | 014 | P1 parte 1 feita; P3 (camada de bandeiras) |
| Moeda clicável/hover, câmbio, estado da moeda e da economia, comparar países | 009 | P4 |
| Página de notícias geopolíticas do mundo, filtro com Jev | 008 | P5 |
| Avaliação de stack para crescer | ADR-001 | feito (este repo, `specs/ADR-001-stack.md`), aguarda decisão |
| Mais informações sobre como vive o povo | 015 | P4 |
| História mais elaborada e expansível | 016 | P4 |
| Idiomas: oficiais e outros (indígenas, imigração, sinais) com cores diferentes | 017 | P4 |
| Figuras mais importantes do país | 007 | P1 feito (em mocks até P0) |
| Ideologias: pensadores e figuras de cada lado, o que fizeram | 018 | P4 |

## P0 - Publicar o que já está pronto (dono; bloqueado para agentes pelo modo automático)
1. Banco de produção (Supabase), na pasta `atlas-api`:
   `DATABASE_URL=<SUPABASE_DATABASE_URL do .env> PYTHONPATH=src .venv/Scripts/python.exe -m alembic upgrade head` (0002 → 0006)
   depois `... -m atlas_api.cli import-content` e `... -m atlas_api.cli import-facts` (usam `data_out/*.json` já gerados localmente).
2. `fastapi cloud deploy` (de dentro de `atlas-api`, branch `feat/v1.1-phase-b`).
3. Conferir: `curl https://atlas-api.fastapicloud.dev/v1/glossary`, `/v1/countries/BR/leaders`, `/v1/countries/BR/people`.
4. Mergear atlas-api PR #4 e atlas-web PR #1 (o PR do web é seguro antes do passo 1). Depois: `cd geo && npm run smoke`.
Para liberar isto para agentes no futuro: adicionar regras de permissão para `alembic upgrade`, `fastapi cloud deploy` e `gh pr merge`.

## P1 - Front da v1.1 (dados que a API já tem) - Sonnet - FEITO (2026-11-12, branch `feat/v1.1-front`)
Todas as 7 tarefas abaixo implementadas e verificadas em mocks (campos novos opcionais no zod; endpoints novos degradam para "seção oculta"). Pendente: `npm run smoke` e screenshots BR/JP/US contra a produção depois do P0.
| Tarefa | Spec | Notas |
|---|---|---|
| zod + mocks v1.1 a partir de `atlas-api` (`GET` reais ou `openapi.generated.json`) | 004-007 | campos novos opcionais no schema até P0 sair |
| Tooltip + popup `<dialog>` + página `#/glossario` | 004 | componente `Tooltip` reutilizado por 009/017 |
| Estrela da capital no globo | 005 | técnica dos markers |
| Governantes (lista, foto com crédito) | 006 | o atual também em "Política hoje" |
| Pessoas importantes (filtro por domínio, atribuição CC BY-SA) | 007 | ocupação em inglês: traduzir as 102 ocupações num mapa pt-BR no front (`src/lib/occupations.ts`) |
| Pistas de GeoGuessr | 003 parte 2 | junto da seção GeoGuessr |
| Todos os países ativos + prévia de bandeira no hover | 014 parte 1 | |
Verificar: typecheck, build, vitest, screenshots BR/JP/US, `npm run smoke` depois do deploy.

## P2 - Migração para Next.js (Opus) - FEITO (2026-11-12, branch `feat/nextjs`, spec [020](020-nextjs.md))
ADR-001 aprovado. Next.js 16.4.6 App Router: `/`, `/pais/[iso2]` (196 páginas SSG + ISR 1 h, metadata/OG por país), `/glossario`
(servidor); globo no layout (não remonta); hash antigo redirecionado; `NEXT_PUBLIC_API_URL`; tipos gerados do OpenAPI
(`npm run api:types`) + checagem zod x OpenAPI no `tsc`. First Load JS 236 kB gzip (antes: bundle único de 707 kB gzip / 2,5 MB).
Pendente do dono: Vercel (ver spec 020, "Vercel"); a API caiu com a rajada de requisições do build (ver spec 020, "Achados").

## P3 - Camada de bandeiras - Opus
014 parte 2 (atlas de texturas no shader). Medir performance.

## P4 - Conteúdo do país (API Opus, web Sonnet). Contrato v1.2 parte A
Ordem (cada uma API → web): 019 (correções: data_version, Dinamarca, imagens no Storage, várias capitais) → 017 idiomas →
015 perfil do povo → 009 moeda/câmbio/economia → 016 história expandida → 018 ideologias.
Aplicar no início desta fase o contrato v1.2 com os deltas de 009, 015, 016, 017, 018 (texto exato nas specs da API).

## P5 - Notícias e espectro (Opus). Contrato v1.2 parte B
008 notícias (spike GDELT + Jev com 200 manchetes rotuladas antes de ligar o job; secrets `TYPESAFE_API_KEY`, `DATABASE_URL` no GitHub),
006 v1.2 espectro político (V-Party + ParlGov + Party Facts; um marcador por partido da coalizão).

## P6 - Extras
010 música (Wikidata P495 + Last.fm, ler termos), 011 vídeos (curadoria manual), 012 viagem no tempo (depende de importar snapshots
históricos; decidir historical-basemaps GPL-3.0 vs CShapes 2.0), 003 parte 1 (rever falsos negativos do Plonk It: ex. Peru).

## Pendências de conteúdo que precisam de humano
- Revisar `atlas-api/content/glossary.yaml` e `regimes.yaml` (rascunhos).
- Revisar verbetes de ideologias (018) e eventos curados do Brasil (016) quando forem escritos (rascunhos neutros com fonte).
