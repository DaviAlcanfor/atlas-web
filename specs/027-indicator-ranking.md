# 027 - Ranking de países no mapa ("tier list")
Status: done | Repos: web + API | Contrato: v1.4 (CR-006) | API: atlas-api/specs/027-indicator-ranking.md

## Pedido (2026-11-13)
"No próprio mapa ter um seletor de indicador, tipo top 10 países IDH, top 10 densidade populacional, e aí faz o heatmap."

## Feito
- Camada "Ranking" na barra de camadas: seletor com os 24 indicadores + densidade, escala de 7 faixas, top 10 clicável
  (abre o país). Cada faixa = 1/7 dos países com dado (septis da posição), então a cor mostra a posição relativa, não a
  distância entre valores. Sem dado = pontos apagados.
- Cor: um só tom, escuro = menor, claro = maior (num fundo escuro a âncora da escala sequencial se inverte; regra da skill
  dataviz). Passos 600..100 da rampa azul validada da skill (`rankRamp` em `lib/palette.ts`), distinta do ciano de "sem dado".
  O pedido original era "mais escuro quanto maior"; com o globo escuro o 1º lugar sumiria no fundo.
- "1º = maior valor, não necessariamente o melhor" escrito na legenda (1º em homicídios é a taxa mais alta).

## Tarefas
- [x] cliente + zod + mock (`indicators`, `indicatorRanking`), checagem de contrato
- [x] `Globe`: material por cor criado sob demanda; com `tint`, país sem cor = apagado
- [x] `RankingLayer` + testes das faixas
