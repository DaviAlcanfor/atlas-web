# TODO — o que falta no Atlas

Estado: fase 1 (globo) entregue, aguardando revisão; fase 2 (API + mocks + painel) em andamento.

## Fase 1 — pendências
- [ ] Comparação lado a lado: render do Playwright (`npm run shot`) vs. screenshot de referência 2, listando cada diferença visível.
- [ ] Ajustar o brilho da atmosfera (halo externo ainda mais fraco que a referência; referência: ~#275f97 a 14px do limbo, ~#1e3a56 a 8px).
- [ ] Cor da costa (`palette.coast`) é um palpite; amostrar da referência.
- [ ] Performance: mediana ~30–40 fps ao arrastar no Intel Iris Xe (globo puro: 120 fps). Custo restante entre polígonos/linhas não isolado. Fazer um trace no Chrome DevTools; se necessário, fundir polígonos por material em um único mesh.
- [ ] Confirmar a altitude inicial (0.92, medida da imagem) vs. 1.8 da especificação.
- [ ] Ilhas < ~400 km² foram removidas dos polígonos (mantidas nas linhas de costa); decidir se é aceitável.
- [ ] Territórios sem ISO2 (Somaliland, N. Cyprus, Siachen etc.) ficam sem conteúdo; decidir tratamento.
- [ ] Fontes vêm do Google Fonts (CDN); decidir se vai hospedar localmente.
- [ ] Dependências transitivas (`three-globe`, `globe.gl`) não estão pinadas além do lockfile.
- [ ] Remover o hook de debug `window.__globe` (só em DEV) se não for mais necessário.

## Transversal
- [ ] README: como rodar o ETL, adicionar ano de snapshot, limitações (bordas históricas aproximadas, Kosovo/Taiwan/Crimeia).
- [ ] Rodapé com atribuição (placeholders `TODO` até confirmar o texto de licença com o README da API).
- [ ] Qualidade: foco visível em todos os controles, `prefers-reduced-motion`, sem scroll horizontal a 400px (revisar painéis).

## Fase 2 — API, mocks e painel do país
- [ ] Cliente tipado (`src/api/client.ts`) + validação zod + modo mock (`VITE_API_URL` ausente).
- [ ] `CountryPanel` e `LayerToggle` sobre mocks.
- [ ] Quando a API expuser `indicators` (hoje v1.0 não tem), adicionar ao painel.
- [ ] Gerar tipos com `openapi-typescript` quando `contract/openapi.generated.json` existir e apagar os tipos escritos à mão.

## Fase 3 — camada histórica + slider (sobre mocks)
- [ ] `Timeline` com ticks, leitura do ano, snap ao snapshot mais próximo mostrando `distance_years`.
- [ ] Camada histórica colorida por SUBJECTO; BORDERPRECISION = 1 com stroke mais fraco.
- [ ] `HistoricalPanel` via `/v1/snapshots/{year}/links` + `/v1/polities/{id}`; estados: snapshot carregando, polígono sem vínculo, polity sem eventos, ano fora do intervalo.
- [ ] Antes de começar: reportar anos de snapshot reais, tamanhos e implicações da licença GPL-3.0.

## Fase 4 — integração
- [ ] Definir `VITE_API_URL`; listar toda divergência contrato x resposta real (CORS, cabeçalhos ETag/Cache-Control, dados ainda em stub).

## Fase 5 — busca, polish e deploy
- [ ] `SearchBox` (`GET /v1/search`) com fly-to.
- [ ] Deploy na Vercel.
