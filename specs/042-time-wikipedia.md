# 042 - Wikipédia dentro da viagem no tempo (web)
Status: in progress (aprovada: o dono pediu em 2026-11-18, "na viagem no tempo, mostrar dentro do site as informações da Wikipedia da entidade") | Contrato: v1.16 (CR-018) | API: atlas-api/specs/042-polity-wikipedia.md | Web: 012-time-travel.md

## Por quê
O painel histórico só mostrava o link da Wikipédia. Agora mostra o resumo (lead do artigo) dentro do site.

## Requisitos
- QUANDO uma entidade histórica é selecionada e tem `wikidata` ENTÃO busca `GET /v1/entities/{qid}/wikipedia` (sob demanda, cache em memória por Q-id).
- Com resumo: bloco "Na Wikipédia" com o `text` (texto puro, nunca HTML), "Ler mais" no `url` (nova aba) e SEMPRE a linha `attribution` com
  links para `url` e `license_url` (CC BY-SA 4.0 exige). Texto > 600 caracteres: recolhido, botão "mostrar mais" (aria-expanded).
- Carregando: esqueleto discreto. 404 (sem artigo; é o caso normal em produção até o dono importar os dados) ou erro: sem bloco, o painel fica como antes.
- Sem imagens (a API não serve).

## Contract delta consumido
`WikipediaSummary`, `GET /v1/entities/{qid}/wikipedia` (404 = sem artigo), `PolityDetail.wikipedia_summary` (não usado ainda: o mapa só tem Q-ids).

## Tarefas
- [x] tipos regenerados (de `atlas-api` origin/main), zod `WikipediaSummary`, `api.entityWikipedia` (404 = null), mock com 3 resumos
- [x] bloco no `HistPanel` (`TimeTravel.tsx`), estilos em `styles.css`
- [ ] dono importa os resumos em produção (ETL `wikipedia-polities`)
