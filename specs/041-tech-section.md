# 041 — Tecnologia e chips (web)
Status: in progress (aprovada pelo dono em 2026-11-18: "faz o resto") | Contrato: v1.15 (CR-017) | API: atlas-api/specs/041-tech-trade.md

## Por quê
Mostrar o comércio exterior de circuitos integrados, computadores, aeronaves, semicondutores e telecom por país (BACI, já no banco).

## Requisitos
- QUANDO `GET /v1/countries/{iso2}/tech` traz `products` não vazio ENTÃO `/economia/[iso2]` mostra a seção "Tecnologia e chips" e o item "Tecnologia" no índice.
- QUANDO `products` é vazio, a rota falha (404, rede) ou ainda carrega ENTÃO nada aparece (sem aviso), como o bloco "Comércio".
- Rótulos pt-BR da API sem alteração (CC BY-ND 3.0); fonte e licença vindas de `sources`.

## Contract delta consumido
CR-017 (`CountryTech`, `TechProduct`); tipos gerados + `contract-check.ts`; mock `src/api/mocks/tech.json` (JP, valores ilustrativos).

## Design
Um cartão por produto (HS) em grade responsiva; exportação e importação lado a lado: valor em US$, parte do total, top 5 parceiros (barras, bandeira e nome como em Comércio).

## Tarefas
- [x] zod + tipos gerados + mock + teste
- [x] Seção e índice em `/economia/[iso2]`
