# TODO — o que falta no Atlas

Estado: fase 1 (globo) entregue, aguardando revisão. Tudo abaixo é pendente.

## Fase 1 — pendências
- [ ] Comparação lado a lado: render do Playwright (`npm run shot`) vs. screenshot de referência 2, listando cada diferença visível.
- [ ] Ajustar o brilho da atmosfera (halo externo ainda mais fraco que a referência; referência: ~#275f97 a 14px do limbo, ~#1e3a56 a 8px).
- [ ] Cor da costa (`palette.coast`) é um palpite; amostrar da referência.
- [ ] Performance: mediana ~30–40 fps ao arrastar no Intel Iris Xe (globo puro: 120 fps). Custo restante entre polígonos/linhas não isolado (medições muito ruidosas). Fazer um trace no Chrome DevTools; se necessário, fundir polígonos por material em um único mesh.
- [ ] Confirmar a altitude inicial (0.92, medida da imagem) vs. 1.8 da especificação.
- [ ] Marcadores: confirmar a lista de micro-estados soberanos (hardcoded em `scripts/build-data.ts`); trocar por `independent` da REST Countries na fase 2.
- [ ] Ilhas < ~400 km² foram removidas dos polígonos (mantidas nas linhas de costa); decidir se é aceitável.
- [ ] Territórios sem ISO2 (Somaliland, N. Cyprus, Siachen etc.) ficam sem conteúdo; decidir tratamento.
- [ ] Fontes vêm do Google Fonts (CDN); decidir se vai hospedar localmente.
- [ ] Dependências transitivas (`three-globe`, `globe.gl`) não estão pinadas além do lockfile.
- [ ] Remover o hook de debug `window.__globe` (só em DEV) se não for mais necessário.

## Transversal (ainda não feito)
- [ ] Testes (vitest + RTL): validação de schema, merge facts + conteúdo, seleção do snapshot mais próximo, formatação de anos a.C.
- [ ] `src/lib/{merge,years,schema}.ts`, `src/hooks/useNearestSnapshot.ts`.
- [ ] README: 3 peças de dados (geometria, dados, código), como rodar o ETL, adicionar país/ano, limitações (bordas históricas aproximadas, Kosovo/Taiwan/Crimeia e decisão do dataset).
- [ ] Rodapé com atribuição e aviso GPL-3.0 (historical-basemaps) + licença do Natural Earth.
- [ ] Qualidade: foco visível em todos os controles, `prefers-reduced-motion` (já no fly-to), sem scroll horizontal a 400px (OK no globo; revisar painéis).

## Fase 2 — dados e fatos no painel
- [ ] Ler a doc da REST Countries v5 e confirmar limites do plano gratuito **antes** de escrever o script.
- [ ] Decidir a camada de fetch (ver AGENTS.md, "Data strategy"): build-time vs. proxy serverless + cache. A chave `RESTCOUNTRIES_API_KEY` nunca vai para o browser.
- [ ] World Bank (população/PIB) como segunda fonte opcional; verificar endpoints.
- [ ] `facts.json` (ou equivalente) + merge com `content/<ISO2>.json`; mostrar fonte e "updated at" por bloco; ausente = "no data".
- [ ] `CountryPanel` (bandeira, nome, capital, regime, idiomas, moedas, população, memberships, timeline histórica com a.C., política atual); painel de 380px no desktop, bottom sheet no mobile.
- [ ] Schema zod para `content/*.json`.
- [ ] `LayerToggle`: "Has content" vs. "Political regime" (paleta suave).

## Fase 3 — camada histórica + slider
- [ ] Antes de começar: reportar anos de snapshot reais, tamanhos antes/depois da simplificação e implicações da licença GPL-3.0.
- [ ] Baixar snapshots (≈1500, 1700, 1815, 1880, 1914, 1920, 1945, 1960, 1994) de aourednik/historical-basemaps, simplificar (<~1.5 MB cada) para `public/data/historical/`.
- [ ] `Timeline` com ticks, leitura mono do ano, snap ao snapshot mais próximo mostrando o ano real; "Today" usa a camada moderna.
- [ ] Cor por SUBJECTO; BORDERPRECISION = 1 com stroke mais fraco; `content/historical-links.json`.

## Fase 4 — painel histórico
- [ ] `HistoricalPanel`: NAME, PARTOF, ano do snapshot, resumo da Wikipedia + link, aviso de bordas aproximadas (verificar CORS ou buscar no build).

## Fase 5 — busca, conteúdo e deploy
- [ ] `SearchBox` (camada moderna) com fly-to.
- [ ] Conteúdo seed de ≥20 países (Brasil, Áustria, Japão, Egito, Alemanha, Turquia, Itália, Grécia, Mongólia, EUA incluídos), ≥4 eventos cada; incerteza marcada com TODO, nunca inventar. Hoje `content/` tem só 5 stubs (iso2 + nome).
- [ ] Deploy na Vercel.
