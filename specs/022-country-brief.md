# 022 - Resumo do país ("Em resumo")
Status: done | Repos: web + API | Contrato: v1.5 (CR-007) | API: atlas-api/specs/022-country-brief.md

## Pedido (2026-11-13)
TL;DR do país (geografia + população + história + economia) e uma parte "hoje". Por decisão do dono: uma fórmula com os dados da
API, revisada por um modelo barato (GPT-6 Luna) só na redação; a parte de notícias fica para a spec 008.

## Feito
Bloco "Em resumo" logo abaixo do resumo oficial no painel: texto, "Hoje." (governo e últimos indicadores), e a nota "Montado
pelo Atlas com os dados desta página; redação revisada por IA (gpt-6-luna), sem acrescentar fatos" com as fontes. Sem resumo
gerado (404) ou erro: o bloco some.

## Tarefas
- [x] zod + cliente + mock (`brief`), checagem de contrato
- [x] `BriefSection` no painel
