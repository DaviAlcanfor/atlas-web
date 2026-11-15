# 029 - Do que vive a economia: setores, exportações, parceiros
Status: draft (2026-11-15; aguarda aprovação do dono) | Contrato: fase 1 sem mudança; fase 2 depende de CR | API: atlas-api/specs/029-economy-structure-trade.md

## Por quê
Mostrar de onde vem a renda de cada país (agro, indústria, serviços, petróleo, alta tecnologia), o que ele exporta e com quem
negocia. Fontes, licenças e fases estão na spec da API.

## Requisitos (QUANDO ... ENTÃO ...)
- QUANDO o painel de um país abre, ENTÃO o bloco "Do que vive a economia" mostra as barras de setor (% do PIB) e de composição das
  exportações, cada uma com ano e fonte; indicador sem dado não aparece.
- QUANDO há frase-resumo ("economia apoiada em petróleo"), ENTÃO ela vem de uma regra explícita sobre os números, e o (i) diz a regra.
- (fase 2) QUANDO a API manda `/trade`, ENTÃO aparecem "O que exporta" (até 10 produtos) e "Com quem negocia" (até 10 parceiros com
  bandeira, clicáveis para abrir o país).
- (fase 3) QUANDO um país está selecionado e a camada de comércio está ligada, ENTÃO arcos saem dele até os principais parceiros.

## Design
- Bloco novo no painel, entre "Em resumo" e "Como vive o povo"; barras no estilo do perfil (`charts.tsx`).
- Página `/economia/[iso2]` ganha as mesmas seções.
- Estados: carregando (esqueleto), vazio (bloco some), erro (mensagem curta, resto do painel segue).

## Tarefas
- [ ] Fase 1: bloco "Do que vive a economia" + verbetes novos no glossário
- [ ] Fase 2: zod + mocks no formato do Contract delta; seções de exportação e parceiros
- [ ] Fase 3: arcos no globo

## Decisões abertas
Ver a spec da API (relações diplomáticas, nomes dos produtos em português, ano dos dados).
