# Plano de execução (2026-11-12)

Planejado com Fable/Opus, executado por Opus/Sonnet. Cada tarefa aponta para a spec (fonte da verdade) e diz quem executa.
Specs do web: `specs/NNN-*.md` deste repo. Specs da API: `atlas-api/specs/NNN-*.md`. Mesmo número = mesma feature.
**Regras para quem executa:** ler o `AGENTS.md` do repo e a spec antes de codar; API antes do web; contrato só muda com CR aprovada
(o dono aprovou a v1.2 em bloco: aplicar no `CONTRACT.md` dos dois repos no início da fase que a usar); terminar cada tarefa com
testes + screenshots (web) e marcar os checkboxes da spec. Um subagente por repo quando a tarefa cruza os dois.

## RETOMAR AQUI (estado em 2026-11-15)

### Conferido na produção em 2026-11-15
- Já no ar desde o último registro: 008 notícias (API PRs #19/#20, web #21), 022 "Em resumo" (API #18), 027 ranking (API #17),
  012 etapa 1 (API #16). Dados da 026 importados (organizações curadas, DDD em 27/27 estados do Brasil) e correntes da 018 também.
- 016: `event_count` já não é 0 (Brasil: 0, 1, 1, 7, 8 por período). Conferir se a fase 2 está completa antes de reabrir.
- **017 idiomas segue fora do ar**: `languages_spoken` vem vazio para todos os países.
- Em PR (aguardando merge do dono): web #23 polimento 4 (spec 028: coluna de ícones, carregamento que espera o globo).

### Feito em 2026-11-15
- 017: a classificação mandava para "imigração" tudo o que não tinha prova de ser nativo (Índia: 399 de 444; Nigéria: 220).
  Regra nova: "imigração" exige uma pátria em outro país (oficial P37 ou nativa P2341 lá) ou família estrangeira na região;
  sem pátria em lugar nenhum = língua local = "indígena". A coleta, que estava incompleta, foi terminada.
- Glossário: +17 verbetes (12 de economia com a página do indicador do Banco Mundial como fonte, taxa de câmbio, 4 de sistemas
  de governo). No web, tema "Economia e indicadores" e o (i) de cada indicador abre o verbete. **Dados**: `import-content` na produção.

### No ar
API v1.3 (proposta, CR-004) e front com tudo das specs 001-024 fase 1: globo em pontos, painel do país (perfil do povo, economia,
câmbio, idiomas, governantes, pessoas, história resumida da Wikipédia com períodos, pistas de GeoGuessr), estados com bandeira e
dados (3.754 subdivisões), glossário por tema, camadas (regime, bandeiras, GeoGuessr), READMEs com screenshots.
Produção: schema migra sozinho ao subir (API PR #7); **dados** continuam manuais: `import-facts` contra o banco de produção a partir
do worktree `atlas-api-deploy` (no commit em produção), com `AUTO_MIGRATE=false`.

### Feito em 2026-11-13 (tarde)
- Spec 026 (polimento 3) mergeada nos dois repos. **Dados ainda não importados na produção**: rodar `import-prod-026.ps1`
  (na raiz do workspace; o modo automático bloqueia a importação). Sem isso não aparecem organizações novas, DDD, resumo de
  história melhor nem as correntes políticas (018 nunca foi importada).
- Viagem no tempo, etapa 1 (spec 012): `etl cliopatria` (130 retratos em `public/data/historical`, CR-005), `/v1/snapshots` com
  dados reais, slider + camada histórica + painel básico no web. Próxima etapa: entidades e links no banco, fatos da época
  (`etl wikidata-polities`), estilos de mapa por época, séries.
- LLM e Jev: usar o Vercel AI Gateway (`AI_GATEWAY_API_KEY`; LLM em `https://ai-gateway.vercel.sh/v1`, Jev em `.../typesafe`),
  uma chave com orçamento por uso (notícias, resumos, chatbot). O dono adiciona a chave.
- Idiomas (017): `languages.json` tem 197 países, mas o Brasil sai com 227 idiomas e muitos indígenas como "cooficial":
  revisar a classificação antes de importar (ficou fora do script de produção de propósito).

### Feito no fim de 2026-11-15 (tudo em produção)
- 017 idiomas importados (7.620; Talian cooficial em 15 municípios); glossário com 63 verbetes; spec 029 fase 1 (bloco "Do que vive a
  economia" + 12 indicadores no ranking); bandeira em todas as ilhas; coluna de ícones com nome; favicon; READMEs dos dois repos.
- Lição: `import-facts` também regrava o câmbio com o `fx.json` local; depois dele, rodar `gh workflow run fx-daily.yml`.

### Plano revisto em 2026-11-17 (dono: "planeja como fazer o resto e dale" = aprovação das ondas abaixo)
Feito desde 2026-11-15: 029 fases 2 e 3 (BACI no ar, `/trade`, arcos, botão Comércio, `/economia/[iso2]`), 030 layout do celular,
seções recolhíveis, contrato v1.7/v1.8 (CR-009, CR-010) colado pelo agente a pedido do dono (PRs api#26, web#34).
Regras: no máximo 2 agentes Opus ao mesmo tempo; um por repo (worktree próprio se o checkout principal estiver ocupado); licença
lida e citada na spec ANTES do código; todo PR visível com prints antes/depois; modelo de IA só `openai/gpt-6-luna` (dono).

| Onda | Item | Spec | API | Web | Situação |
|---|---|---|---|---|---|
| 1 | Chatbot (gpt-6-luna, chave do AI Gateway) | 025 | `POST /v1/chat` SSE, CR-012 | gaveta à esquerda | API em andamento |
| 1 | IDH por estado + governador | 024 fase 2 | GDL + fonte do governador, CR-011 | card do estado | API em andamento |
| 1 | Bolsa: cotação no site (widget TradingView, grátis com a marca, 15 min de atraso) | 031 | — | seção no painel, lista país → índice | a fazer (web) |
| 2 | Web do chatbot e da 024 fase 2 | 025, 024 | — | sim | depois da onda 1 |
| 3 | Organizações (UE, BRICS, OTAN, Mercosul...) + camada no globo | nova | lista curada com fontes | camada + seção | a fazer |
| 3 | Prêmios Nobel por país | nova | Nobel Prize API (ler termos) | seção | a fazer |
| 3 | "Acontecendo agora": terremotos (USGS, domínio público) e eventos naturais (NASA EONET) | nova | job | pontos pulsando | a fazer |
| 4 | Tecnologia e chips (BACI já importado: SH 8542, 8471, 8802/8803) + alta tecnologia (WDI) | nova | agregado do BACI | seção | a fazer |
| 4 | Grafo "quem produz o quê" (BACI) | nova | rota por produto | página com grafo | a fazer |
| 4 | Esportes (medalhas por esporte) | nova | Olympedia/Wikidata (ler licença) | seção | a fazer |
| 4 | História da bandeira (Wikidata P41 com datas + Commons) | nova | sim | seção | a fazer |
| 5 | Radar aéreo (OpenSky, ler termos: não comercial) e satélites (CelesTrak) | nova | — | camada | a fazer |
| 5 | Vídeos do Prof. Ricardo Marcílio (YouTube Data API: chave do dono) | nova | job | seção | precisa da chave |
| 5 | Divas pop (Wikidata + Pantheon) | nova | sim | seção | a fazer |

### Pendente (revisto em 2026-11-15, fim do dia; ver o plano de 2026-11-17 acima)
1. **Contrato**: o dono cola a CR-009 (grupo `economy` do perfil) no `CONTRACT.md` dos dois repos (e a CR-004, se ainda faltar).
2. **029 fase 2**: comércio por produto e parceiro (BACI, Etalab 2.0): ETL, CR com a rota `/trade`, web; nomes dos produtos em
   português (ler os termos da NCM antes). Fase 3: arcos no globo.
3. **025 chatbot**: rascunho; precisa da chave e de um teto de gasto (decisão do dono).
4. **024 fase 2**: IDH subnacional (Global Data Lab, ler termos), governador (fonte melhor que o Wikidata, que está desatualizado).
5. Revisão humana: `glossary.yaml` (agora 49 verbetes de rascunho + correntes), `regimes.yaml`, `explanations.ts`; amostra dos idiomas.
6. Ajustes da 019 no FastAPI Cloud (réplicas, pool).

### Próximas fases (depois do acima), detalhes nas seções abaixo
- P4 resto: 016 história (agora em **texto corrido por período**, ver P4.5) e 018 ideologias. Contrato v1.2 parte B.
- P4.5: cantores/divas pop em Pessoas (grupo "Música"), resumos por IA (escrever spec 022; executor carrega a skill `claude-api`).
- P5: 008 notícias (GDELT + Jev) e "acontecendo agora"; 006 v1.2 slider esquerda/direita.
- P6: 010 música, 011 vídeos (incl. Prof. Ricardo Marcílio), Plonk It falsos negativos.
- P7: viagem no tempo com Cliopatria + estilos de mapa por época.
- Backlog B1-B14 (terceira rodada): economia/produção, bolsas, blocos (UE, BRICS...), Nobel, esportes, história da bandeira,
  radar aéreo/satélites, tecnologia/chips, grafo "quem produz o quê".

### Pequenos pendentes
- Revisão humana: `atlas-api/content/glossary.yaml`, `regimes.yaml`, textos de `geo/src/lib/explanations.ts` (17 de ~22 escritos pelo agente).
- Favoritos de moedas salvos no navegador (B3) não feitos.

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
| Todos os países com cara de clicáveis + bandeiras | 014 | Feito (parte 1 em P1, parte 2 em P3) |
| Moeda clicável/hover, câmbio, estado da moeda e da economia, comparar países | 009 | P4 |
| Página de notícias geopolíticas do mundo, filtro com Jev | 008 | P5 |
| Avaliação de stack para crescer | ADR-001 | feito (este repo, `specs/ADR-001-stack.md`), aguarda decisão |
| Mais informações sobre como vive o povo | 015 | P4 |
| História mais elaborada e expansível | 016 | P4 |
| Idiomas: oficiais e outros (indígenas, imigração, sinais) com cores diferentes | 017 | P4 |
| Figuras mais importantes do país | 007 | P1 feito (em mocks até P0) |
| Ideologias: pensadores e figuras de cada lado, o que fizeram | 018 | P4 |

## P0 - Publicar a v1.1 - FEITO (2026-11-12)
API v1.1 no ar (banco migrado 0002 → 0006 e dados importados depois de um incidente de 503, ver "Lições"); front v1.1 + Next.js
+ camada de bandeiras no ar (atlas-web PRs #1, #4, #5).

## Lições operacionais (ler antes de publicar qualquer coisa)
- **Ordem de deploy da API**: o merge na `main` do atlas-api publica no FastAPI Cloud na hora. Migração do banco de produção ANTES do merge.
  Rodar a partir de um checkout da `main`/do PR (git worktree), nunca de uma branch com migrações mais novas, e com revisão explícita
  (`alembic upgrade 0006`, não `head`). Ensaiar antes num banco local descartável (`CREATE DATABASE atlas_rehearsal`).
- **PRs sempre com base `main`**, um por vez. PRs empilhados (base = branch de outro PR) foram mergeados nas branches erradas e o código
  não chegou à `main` (incidente de 2026-11-12).
- **Modo automático bloqueia** migração de produção, deploy e `gh pr merge` mesmo com aprovação em chat; com pedido explícito do dono na
  hora ("roda você") a migração passou. Alternativa: script `.ps1` ensaiado para o dono rodar. Scripts para o Windows PowerShell 5.1
  devem ser só ASCII (ele lê arquivo sem BOM como ANSI e corrompe "Área de Trabalho").
- **Build do Next.js** chama a API para 196 páginas: manter concorrência 4 (48 simultâneas derrubaram a API; spec 019 item 5).
- **Limite de uso**: rodar no máximo 2 subagentes Opus ao mesmo tempo; ao bater o limite, retomar o mesmo agente (SendMessage).

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

## P1.5 - Polimento 021 - FEITO (2026-11-12, branch `feat/polish-round`, spec [021](021-polish-round.md))
Estados com linha dupla + botão + hover, fronteiras mais fortes, paleta categórica de regime (validada), bandeiras nítidas (w160), ⓘ em todos os rótulos,
camada GeoGuessr (Street View, Wikipedia CC BY-SA), tela de carregamento com progresso real, painel 540 px e mais opaco.

## P2 - Migração para Next.js (Opus) - FEITO (2026-11-12, branch `feat/nextjs`, spec [020](020-nextjs.md))
ADR-001 aprovado. Next.js 16.4.6 App Router: `/`, `/pais/[iso2]` (196 páginas SSG + ISR 1 h, metadata/OG por país), `/glossario`
(servidor); globo no layout (não remonta); hash antigo redirecionado; `NEXT_PUBLIC_API_URL`; tipos gerados do OpenAPI
(`npm run api:types`) + checagem zod x OpenAPI no `tsc`. First Load JS 236 kB gzip (antes: bundle único de 707 kB gzip / 2,5 MB).
Pendente do dono: Vercel (ver spec 020, "Vercel"); a API caiu com a rajada de requisições do build (ver spec 020, "Achados").

## P3 - Camada de bandeiras - Opus - FEITO (2026-11-12, branch `feat/flag-layer`, spec [014](014-all-countries-active.md))
014 parte 2: camada "Bandeiras" com atlas w80 (canvas 1280x1040, 8 downloads por vez) e um material por país no mesmo programa.
Drag no swiftshader: mediana +3%, p95 +10% vs Padrão (meta < 15%).

## P4 - Conteúdo do país (API Opus, web Sonnet). Contrato v1.2 parte A
API parte A FEITA na branch `feat/v1.2-data` (019, 017, 015, 009; CR-003 com o texto do contrato); falta: aplicar CR-003, migrar produção
(ver "Lições"), PR. Front de 017/015/009 FEITO na branch `feat/v1.2-front` (sobre mocks das amostras reais; falta rodar contra a API v1.2 e `npm run smoke` depois da migração). Depois: 016 e 018.
Ordem (cada uma API → web): 019 (correções: data_version, Dinamarca, imagens no Storage, várias capitais) → 017 idiomas →
015 perfil do povo → 009 moeda/câmbio/economia → 016 história expandida → 018 ideologias.
Aplicar no início desta fase o contrato v1.2 com os deltas de 009, 015, 016, 017, 018 (texto exato nas specs da API).

## P5 - Notícias e espectro (Opus). Contrato v1.2 parte B
008 notícias (spike GDELT + Jev com 200 manchetes rotuladas antes de ligar o job; secrets `TYPESAFE_API_KEY`, `DATABASE_URL` no GitHub),
006 v1.2 espectro político (V-Party + ParlGov + Party Facts; um marcador por partido da coalizão).

## P4.5 - Pedidos de 2026-11-12 (segunda rodada)
| Pedido | Spec | Executor | Situação |
|---|---|---|---|
| Estados visíveis + botão; fronteiras mais fortes; cores de regime distinguíveis; bandeiras sem borrão; ⓘ em todo rótulo + animação do tooltip; camada GeoGuessr (cobertura Street View); carregamento com % e mensagens; painel mais opaco, maior, sem expandir | web 021 | Sonnet | em andamento |
| Cantores e cantoras em "Pessoas importantes" (grupo "Música" por ocupação do Pantheon: SINGER, MUSICIAN, COMPOSER, CONDUCTOR...) | API 007 (parâmetro `group=music`) + web 007 | Sonnet | a fazer |
| Resumo por IA de cada parte (política, economia, sociedade): gerado no ETL só a partir dos dados da API, com rótulo "gerado por IA" e fontes; "maioria de direita/esquerda" só com dado de espectro (006 v1.2); exportações via WDI (TX.VAL.FUEL.ZS.UN etc.). O executor carrega a skill `claude-api` antes de escolher modelo/SDK | API 022 (a escrever) + web | Opus | a fazer |
| História em texto corrido por período (condensada do artigo "História de X" da Wikipedia, CC BY-SA, com citação), marcos como apoio | API/web 016 (ampliar) | Opus | a fazer |

## Backlog - pedidos de 2026-11-12 (terceira rodada), ainda sem spec
Fontes são hipóteses: ler termos e licença antes de qualquer código (regra do AGENTS.md da API). Itens que só ampliam uma spec existente
estão marcados com ela.

| # | Pedido | Fonte provável | Nota / spec |
|---|---|---|---|
| B1 | Economia: PIB e **o que o país produz** | WDI (PIB, setores NV.AGR/NV.IND/NV.SRV % do PIB), BACI/CEPII (comércio por produto, base do OEC; checar licença), UN Comtrade (API com chave e limites), FAOSTAT (produção agrícola, CC BY 4.0) | amplia 009 |
| B2 | Bolsa de cada país (estado atual do índice principal: Ibovespa, S&P 500, Nikkei...) | Yahoo Finance **não tem API oficial** (bibliotecas raspam e violam os termos). Candidatas: Stooq (CSV grátis), Alpha Vantage (chave, 25 req/dia), Twelve Data, Financial Modeling Prep. Cotação com atraso, rotulada | nova spec; job diário |
| B3 | Câmbio personalizável | Já na 009 (até 4 moedas, base 100); acrescentar troca da moeda base e favoritos salvos no navegador | amplia 009 |
| B4 | Quem faz parte de UE, BRICS, G7, G20, OTAN, Mercosul, OPEP, ASEAN, UA... | O P463 do Wikidata só é completo para a ONU: lista curada `content/organizations.yaml` com membros e datas de entrada/saída (fonte por organização: sites oficiais/Wikipedia). Camada no globo por organização | amplia 004 (glossário) |
| B5 | Música: **divas pop** do país | Wikidata: pessoas P21 feminino, ocupação cantora, gênero P136 pop, P27 país, ordenadas por sitelinks; cruzar com Pantheon | amplia 010 e 007 |
| B6 | Geopolítica do mundo + **vídeos do Prof. Ricardo Marcílio** | YouTube Data API (lista de uploads do canal; achar o channel id), embed com facade (spec 011); ligar vídeo a países por título + Jev (spec 008). Só link/embed, nunca baixar | amplia 008/011 |
| B7 | **Prêmios Nobel** por país | Nobel Prize API v2.1 (api.nobelprize.org; dados abertos, conferir licença): laureados por país de nascimento/afiliação | nova spec, seção do painel |
| B8 | Melhores esportes do país | Medalhas olímpicas por esporte (Wikidata/Olympedia; checar licença), ranking FIFA; "esportes em que o país mais ganha" | nova spec |
| B9 | História da bandeira | Wikidata P41 com qualificadores de data (bandeiras históricas) + Commons; liga com P7 (bandeira da época) | amplia 002/012 |
| B10 | IDH, natalidade, crescimento | IDH (UNDP), SP.DYN.CBRT.IN (natalidade), SP.POP.GROW (crescimento populacional), NY.GDP.MKTP.KD.ZG | amplia 015 |
| B11 | "Acontecendo agora" (atualidades) | Feed de 008 + Wikipedia Current events + eventos naturais (USGS terremotos, domínio público; NASA EONET) como pontos pulsando no globo | amplia 008 |
| B12 | Radar aéreo, satélites | Aviões: OpenSky Network API (grátis para uso não comercial, limites; ler termos). Satélites: CelesTrak (TLE) + `satellite.js` para posição no globo (camada de objetos do react-globe.gl) | nova spec, camada do globo |
| B13 | Tecnologia e indústria: aeronáutica, chips, memória RAM, o que produz em tecnologia | Comércio por código HS (BACI/Comtrade): 8542 circuitos integrados, 8471 computadores, 8802/8803 aeronaves e partes; WDI TX.VAL.TECH.MF.ZS (alta tecnologia % das exportações) | nova spec, junto de B1 |
| B14 | **Grafo** "quem produz o quê" (comida, chips, petróleo...) e quem vende para quem | BACI/FAOSTAT: grafo produto ↔ países; no globo como arcos (arcsData) do exportador ao importador; página com grafo de força | nova spec, depende de B1/B13 |

## P6 - Extras
010 música (Wikidata P495 + Last.fm, ler termos), 011 vídeos (curadoria manual), 003 parte 1 (rever falsos negativos do Plonk It: ex. Peru).

## P7 - Viagem no tempo (pesquisa feita em 2026-11-12) - Opus
Fonte escolhida: **Cliopatria** (Seshat), CC BY 4.0, 3400 a.C.-2024, 1600+ entidades com faixas de anos e ID do Wikidata por polígono
(descartadas: historical-basemaps GPL-3.0 e só 54 retratos; CShapes 2.0 não comercial). Detalhes, pipeline e contrato v2:
`atlas-api/specs/012-historical-series.md`; slider, painel histórico e **estilos de mapa por época** (manuscrito, carta náutica,
atlas impresso, Guerra Fria, Signal): `specs/012-time-travel.md`.
Ordem: API `etl cliopatria` (~130 retratos TopoJSON ≤ 600 KB, Supabase Storage `atlas-geometry`) → polities/links por Wikidata →
fatos das entidades antigas (bandeira, capital, governo, governantes com datas) → contrato v2 (CR-004) → web slider + camada histórica →
temas por época → séries históricas (Maddison, V-Dem, OWID).

## Pendências de conteúdo que precisam de humano
- Revisar `atlas-api/content/glossary.yaml` e `regimes.yaml` (rascunhos).
- Revisar verbetes de ideologias (018) e eventos curados do Brasil (016) quando forem escritos (rascunhos neutros com fonte).
