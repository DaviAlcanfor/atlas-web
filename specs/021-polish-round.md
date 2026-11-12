# 021 - Rodada de polimento (feedback de 2026-11-12)
Status: approved | Repos: web | Contrato: não muda | Executor: Sonnet

## Itens
1. **Estados visíveis**: as linhas internas (admin-1) somem sobre a bandeira e os pontos. Linha dupla (traço escuro `admin1Line` +
   traço claro fino por cima, 1px cada, levemente deslocado em altitude) para contraste em qualquer fundo. Botão "Estados" no toggle
   (liga/desliga as divisões do país selecionado; ligado por padrão). Hover no estado: o polígono do estado clareia (overlay de pontos
   `iceBright`), além do nome no readout.
2. **Fronteiras de países mais fortes**: subir a opacidade de `border` (0.38 → ~0.6) e `coast`; testar contraste sobre oceano e sobre bandeiras.
3. **Cores do regime distinguíveis**: a rampa de um só matiz não separa 13 categorias. Para a camada de regime (e só ela), usar paleta
   categórica de 8-10 matizes distintos, dessaturados, validada para daltonismo (carregar a skill `dataviz` e usar o validador dela);
   agrupar regimes raros em "outros". Legenda ordenada por número de países, com contagem.
4. **Camada Bandeiras sem borrão**: hoje o atlas usa w80 esticado num quadrado 80x80 (borra e distorce). Usar w160, células com a proporção
   real da bandeira (sem quadrado), atlas até 4096 px de largura (2 texturas se precisar), filtro linear sem mipmap, e reduzir a mistura com os
   pontos para a bandeira ficar tão nítida quanto no país selecionado (spec 002). Medir performance de novo.
5. **Explicação em todo hover + animação**: todo rótulo de informação do painel ganha um ⓘ com tooltip: População, Área, Densidade, Regime,
   Capital, Região, Idiomas, Moedas, Organizações, Política hoje, Governantes, Pessoas, Pistas. Termos com verbete usam o glossário;
   os demais usam textos fixos em `src/lib/explanations.ts` (o que é o dado, de onde vem, como ler). Tooltip com animação de entrada
   (opacity + translateY 4px, 140 ms, `ease-out`; desligada com reduced motion) e leve atraso de abertura (250 ms) para não piscar.
6. **Camada GeoGuessr**: botão no toggle que destaca os países com cobertura oficial do Street View (pontos `ice`) e apaga os demais
   (`iceDim`); 3 níveis se a fonte permitir (cobertura ampla, parcial, só trekker/limitada). Fonte: tabela da Wikipedia "Google Street View
   coverage" (CC BY-SA: atribuir, linkar, data da consulta), gerada por script `scripts/streetview-coverage.ts` em `src/lib/streetview.ts`
   (mesmo padrão do Plonk It). Legenda com fonte e data.
7. **Tela de carregamento**: barra de progresso com porcentagem real, por etapas ponderadas (geometria `modern.geojson` + `lines.json` por
   bytes recebidos via `ReadableStream`, lista de países da API, textura do globo, primeira renderização). No centro, a matriz de pontos
   do mundo se acendendo conforme o progresso (canvas 2D leve, não WebGL). No canto inferior esquerdo, mensagens que trocam a cada ~2,5 s
   (ex.: "Carregando 196 países", "Desenhando 240 mil pontos", "Buscando bandeiras", "Primeira visita é mais lenta: a API acorda do
   modo econômico") e uma curiosidade aleatória curta tirada dos dados. Reduced motion: sem animação, só a barra.
8. **Painel**: fundo menos transparente (`panel` alfa 0.88 → 0.96, blur mantido); remover o botão de expandir e o modo largo; largura
   fixa maior (460 → 540 px desktop; mobile continua folha inferior).

## Tarefas
- [ ] 1 estados + botão + hover do estado
- [ ] 2 fronteiras
- [ ] 3 paleta categórica do regime
- [ ] 4 atlas de bandeiras nítido + perf
- [ ] 5 ⓘ em todos os rótulos + animação do tooltip
- [ ] 6 camada GeoGuessr (script + dados + legenda)
- [ ] 7 tela de carregamento com progresso
- [ ] 8 painel
