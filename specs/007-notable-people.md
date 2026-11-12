# 007 — Pessoas importantes
Status: done (web, em mocks até a API v1.1 ir ao ar) | Contrato: v1.1 | API: atlas-api/specs/007-notable-people.md

## Requisitos
- Seção "Pessoas": até 20, com foto (crédito), nome, ocupação, anos de vida, link Wikipedia; filtro por área
  (política, ciência, arte, esporte, outros).
- Linha explicando a ordenação (`method`) e um ⓘ com o viés conhecido da fonte.

## Contract delta consumido
```
Person { id, name, occupation, domain, birth_year: int|null, death_year: int|null, image: { url, credit, license }|null,
         wikipedia_url: string|null, rank: int }
GET /v1/countries/{iso2}/people?domain=&limit= -> { items: Person[], method: string, source: Source }
```

## Tarefas
- [x] zod + mock; `PeopleSection` com filtro por área (botões `aria-pressed`), até 10 cartões (foto com crédito, nome, ocupação em pt-BR via `src/lib/occupations.ts`, anos, Wikipedia), `method` e atribuição CC BY-SA da `source`. Busca 1 vez os 50 primeiros e filtra no cliente (os botões só mostram áreas presentes); o filtro age sobre esses 50, não sobre todo o país. Sem dados/erro = seção oculta.
