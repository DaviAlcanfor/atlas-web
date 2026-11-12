# Specs (web)

Uma spec por feature, numerada igual à spec correspondente da API (`atlas-api/specs/NNN-*.md`), para rastrear as duas metades.
Status: `draft` → `approved` (só o dono do projeto aprova) → `in progress` → `done`. Sem código de feature em `draft`.

Regras:
- Campo/endpoint novo da API só entra no front depois que `contract/CONTRACT.md` for atualizado (o agente nunca edita o contrato).
  Até lá, a spec lista o "Contract delta" esperado e o front pode ser feito sobre fixtures em `src/api/mocks/` com esse formato.
- Cada spec termina com tarefas em checkbox; marque conforme entrega e atualize o status.

| # | Feature | Depende da API? | Status |
|---|---|---|---|
| 001 | [Linha do tempo](001-timeline-line.md) | não | done |
| 002 | [Bandeira no país selecionado](002-flag-backdrop.md) | não | done |
| 003 | [GeoGuessr: Plonk It + pistas](003-geoguessr.md) | parte 2 | parte 1 done |
| 004 | [Glossário, tooltips, popups, ícones](004-glossary.md) | sim | draft |
| 005 | [Capital e estados](005-capital-subdivisions.md) | capital sim; estados não | in progress (estados feitos) |
| 006 | [Governantes e espectro político](006-leaders-spectrum.md) | sim | draft |
| 007 | [Pessoas importantes](007-notable-people.md) | sim | draft |
| 008 | [Notícias](008-news.md) | sim | draft |
| 009 | [Moeda](009-currency.md) | sim | draft |
| 010 | [Música](010-music.md) | sim | draft |
| 011 | [Vídeos de história](011-history-videos.md) | sim | draft |
| 012 | [Viagem no tempo](012-time-travel.md) | sim | draft |

## Template
```md
# NNN — Título
Status: draft | Contrato: vX.Y | API: atlas-api/specs/NNN-*.md

## Por quê
## Requisitos (QUANDO ... ENTÃO ...)
## Contract delta consumido
## Design (componentes; estados carregando / vazio / erro)
## Tarefas
## Decisões abertas
```
