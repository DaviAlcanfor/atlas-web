# 007 — Pessoas importantes
Status: draft | Contrato: v1.1 | API: atlas-api/specs/007-notable-people.md

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
- [ ] zod + mock; `PeopleList` com filtro (botões `aria-pressed`, como o `LayerToggle`)
