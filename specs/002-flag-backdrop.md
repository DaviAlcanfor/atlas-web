# 002 — Bandeira no fundo do país selecionado
Status: done | Repos: web | Contrato: não muda (usa `flag_url`)

## Por quê
Ao clicar num país, a bandeira aparece "pintada" sobre o território no globo.

## Requisitos (critérios de aceite)
- QUANDO seleciono um país com `flag_url` ENTÃO o polígono dele mostra a bandeira esticada sobre o território (~60% opacidade sobre a cor base),
  com fade de ~300 ms (sem fade com `prefers-reduced-motion`).
- QUANDO desseleciono ENTÃO volta ao preenchimento normal.
- QUANDO `flag_url` é null ou a imagem falha ENTÃO nada muda (sem erro na tela).
- O frame rate ao arrastar não piora de forma perceptível (medir com `npm run shot` antes/depois).

## Dados
`flag_url` já vem da API (`https://flagcdn.com/br.svg`). Verificado em 2026-11-11: flagcdn responde
`access-control-allow-origin: *`, então pode virar textura WebGL. Usar a versão PNG (`https://flagcdn.com/w640/br.png`):
SVG como textura exige rasterizar num canvas. Bandeiras são domínio público em quase todos os países (ver termos do flagcdn antes de codar).

## Design
Só o polígono selecionado recebe um `ShaderMaterial` próprio (o globo já usa um para o hachurado):
o vertex shader converte a posição 3D em lat/lng e gera UV = posição relativa na *bounding box* do país; o fragment mistura a textura da bandeira com a cor base.
Casos difíceis: países que cruzam o antimeridiano (Rússia, Fiji, EUA com Alasca) e países com ilhas distantes (França, Chile):
usar a bbox do **maior polígono** e aplicar a bandeira só nele; as demais partes ficam com a cor normal.
Fallback se o shader não ficar bom: bandeira desfocada como fundo do cabeçalho do painel (CSS puro).

## Tarefas
- [x] web: spike do shader em BR, RU, FR, CL, JP; screenshot de cada um aqui na spec
- [x] web: `flagMaterial.ts` + cache de texturas (uma por país, liberar com `dispose()` ao trocar)
- [x] web: medir fps antes/depois

## Resultado (2026-11-11)
- `src/lib/flagMaterial.ts`: `flagPngUrl` (só aceita `https://flagcdn.com/...`, vira `w640/<code>.png`; outro host = sem bandeira),
  `flagBox` (bbox do maior polígono por `geoArea`; largura em longitude com wrap no antimeridiano), `createFlagMaterial`
  (lat/lng calculados no fragment shader a partir da posição; fora da bbox o peso da bandeira é 0) e `loadFlag`
  (cache LRU de 8 texturas, `dispose()` da que sai; sem mipmaps para evitar borrão/costura).
- `Globe.tsx`: novo prop `apiIds`; ao selecionar país conhecido pela API chama `api.country()` (mesma requisição do painel, cache HTTP),
  carrega a textura e só então troca o material do país selecionado. Fade de 300 ms via uniform (sem fade com reduced motion).
  Qualquer falha (sem `flag_url`, 404, imagem) = preenchimento normal, sem erro na tela. Um único `ShaderMaterial` reutilizado.
- Verificado com a API real (`.env.local`): BR, RU, FR, CL, JP com orientação certa; Kaliningrado (RU), Guiana Francesa/Córsega (FR)
  e Kyushu (JP, fora da bbox de Honshu) ficam com a cor normal. Screenshots: `C:\Users\DAVIFR~1\AppData\Local\Temp\claude\107b785cf82328d4\07048f48-6a47-4b0e-be65-28f7d867ab0e\scratchpad\flags\{BR,RU,FR,CL,JP}.png`.
- fps ao arrastar com BR selecionado (bandeira bloqueada vs. ligada): swiftshader 200 vs 217 ms/frame (renderização em CPU, pior caso);
  GPU real: ruído maior que a diferença (8–25 ms nos dois casos).

### Limites conhecidos
- Bandeira esticada na bbox em lat/lng (não segue a forma do país); países finos/longos (CL) mostram só parte da bandeira.
- Ilhas/partes dentro da bbox do maior polígono também recebem a bandeira; partes fora dela não.
- Com o mouse sobre o país selecionado não há realce de hover (antes também não havia para países com conteúdo).
- No modo mock todos os `flag_url` são null, então lá nunca aparece bandeira.

