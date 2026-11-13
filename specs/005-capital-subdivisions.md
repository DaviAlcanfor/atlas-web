# 005 — Capital no mapa e estados/províncias
Status: done (no ar) (revisado em 2026-11-13) | Contrato: v1.1 (capital) | API: atlas-api/specs/005-capital-coords.md

## Requisitos
- Capital: QUANDO seleciono um país ENTÃO aparece uma estrela na capital com rótulo; com zoom próximo, todas as capitais.
- Estados: QUANDO seleciono um país ENTÃO as fronteiras internas aparecem em linha fina; hover num estado mostra o nome.
  Ao desselecionar, somem.

## Contract delta consumido (capital)
`CountrySummary.capital_coords: [{ name, lat, lng }]` (`[]` = sem dado; mais de um item em países com várias capitais).

## Design
- Capital: mesma técnica dos markers de micro-estados (`htmlElement` estável); estrela via SVG inline.
- Estados: geometria é responsabilidade deste repo. `scripts/build-data.ts` passa a gerar
  `public/data/admin1/<ISO2>.geojson` a partir do Natural Earth admin-1 10m (domínio público), simplificado (meta < 200 KB por país;
  medir e registrar aqui). Carregado só ao selecionar. Linhas: `LineSegments` fundidos, como as bordas atuais (ver notas de performance).
  Picking do estado: point-in-polygon com `d3-geo`, igual aos países.
- Natural Earth traz `wikidataid` por estado: guardar no GeoJSON para uma parte 3 futura (dados do estado via API).

## Tarefas
- [x] estados: baixar admin-1 no `npm run data`, dividir e simplificar; medir tamanhos
- [x] estados: camada de linhas + hover com nome
- [x] capital: zod (`capital_coords` opcional) + mock + estrela vermelha (`signal`) com rótulo, `htmlElement` estável no mesmo layer dos micro-estados; só do país selecionado, e não em micro-estados (o marcador já está lá). Várias capitais = várias estrelas. "Com zoom próximo, todas as capitais" fica para depois.

## Resultado (estados)
- Licença: Natural Earth, termos em naturalearthdata.com/about/terms-of-use: "All versions of Natural Earth raster + vector map data
  found on this website are in the public domain." (crédito opcional; o rodapé já cita Natural Earth).
- Fonte: `ne_10m_admin_1_states_provinces.geojson` do repo nvkelso/natural-earth-vector, tag `v5.1.2` (URL fixa em `scripts/build-data.ts`).
  Baixado uma vez pelo `npm run data` para `.cache/natural-earth/` (~39 MB, gitignored). Sem dependência nova.
- Saída: `public/data/admin1/<ISO2>.geojson` (versionado, como `modern.geojson`): 240 arquivos, total 2314 KB.
  Maiores: RU 183 KB, CA 77 KB, CN 72 KB, GB 64 KB, US 58 KB (BR 43 KB). `npm run data` imprime esses números.
  Cada arquivo: features MultiPolygon `{ name, wikidataid }` (`name` = `name_pt` se houver, senão `name`) para o hover + 1 feature
  MultiLineString com só as fronteiras internas (arestas compartilhadas por dois estados; NE admin-1 é topologicamente limpo).
  Simplificação Douglas-Peucker: linhas 0,03°, polígonos 0,08° (só servem para picking); ilhotas < ~400 km² descartadas dos polígonos.
- Globo: ao selecionar, `fetch` lazy do arquivo; linhas = 1 `LineSegments` fundido (token `admin1Line`) logo acima da tampa elevada.
  Ao desselecionar, o objeto sai de `customLayerData` e o three-globe faz dispose de geometria e material. Arquivo ausente / erro = nada.
  Hover dentro do país selecionado: point-in-polygon `d3-geo` (mesmo `findIn` dos países) e o InfoCard mostra "STATE · <PAÍS>" + nome.
- Performance (swiftshader, 1280x800, BR selecionado, mediana de frame no drag): com estados 183–216 ms, com o arquivo bloqueado
  200–250 ms; ou seja, sem regressão mensurável (o custo de "país selecionado" já existia: bandeira + contorno).
- Screenshots (fora do repo): `C:\Users\DAVIFR~1\AppData\Local\Temp\claude\107b785cf82328d4\07048f48-6a47-4b0e-be65-28f7d867ab0e\scratchpad\admin1\` (BR.png, US.png, DE.png, IN.png, BR-hover-state.png).

### Limites conhecidos
- Lugares sem `iso_a2` no NE (Somalilândia, Chipre do Norte...) não têm arquivo; país com 1 só unidade não tem linhas.
- O ISO2 do arquivo vem do NE (`iso_a2`); territórios que o NE agrupa num país (ex.: dependências) seguem o NE.
- O dev server do Vite responde `index.html` (200) para arquivo ausente; o `fetch` falha no JSON e é ignorado. Em produção é 404,
  que aparece no console do navegador como recurso não encontrado (sem UI de erro).
- Rótulo "STATE" é fixo em inglês como o resto do InfoCard ("COUNTRY"); províncias/regiões também aparecem como "STATE".
- Douglas-Peucker em graus: em latitudes altas a simplificação é relativamente mais fina no eixo lng (inofensivo).
