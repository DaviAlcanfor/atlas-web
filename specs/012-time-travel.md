# 012 — Viagem no tempo
Status: draft | Contrato: v1.0 (fronteiras, já existe) + v2 (séries) | API: atlas-api/specs/012-historical-series.md

## Por quê
Slider de ano no topo que troca o mapa para as fronteiras da época e os dados para os daquele ano.
É a fase 3 do `TODO.md`, ampliada com dados históricos.

## Requisitos
- Slider no topo (abaixo do card "Atlas"), com ticks nos `snapshot_years` e leitura do ano ("1914", "300 a.C.").
  Teclado: setas ±1 ano, PageUp/PageDown ±10, Home/End.
- QUANDO solto o slider ENTÃO o mapa troca para o snapshot mais próximo e mostra "fronteiras de 1914 (−6 anos)".
- QUANDO clico num território histórico ENTÃO painel histórico: nome da época, linhagem, timeline (componente da 001).
- Parte 2 (v2): seletor de métrica (população, regime, PIB per capita) → mapa coroplético daquele ano; ano sem dado = cinza "sem dado".
- Ano no URL (`#year=1914`), como a seleção.

## Bloqueio
`GET /v1/meta` → `snapshot_years: []`. Sem snapshots importados na API e sem arquivos em `public/data/historical/`, o slider
não tem o que mostrar. Licença GPL-3.0 do historical-basemaps precisa de decisão (ver `TODO.md`).

## Contract delta consumido (parte 2)
```
Metric { id, label, unit, description, kind: "number"|"category", categories, sources }
GET /v1/metrics; GET /v1/map?metric=&year= -> { year, metric, items: [{ polity_id, value, source_id }] }
GET /v1/polities/{id}/series/{metric}      -> { items: [{ year, value, precision, source_id }] }
```

## Tarefas
- [ ] decisão de licença + arquivos históricos em `public/data/historical/`
- [ ] slider (`<input type="range">` estilizado: acessível de graça) + troca de camada + painel histórico
- [ ] parte 2: seletor de métrica + coroplético (após v2)
