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
| 004 | [Glossário, tooltips, popups, ícones](004-glossary.md) | sim | ícones done; resto approved (P1) |
| 005 | [Capital e estados](005-capital-subdivisions.md) | capital sim; estados não | estados done; capital approved (P1) |
| 006 | [Governantes e espectro político](006-leaders-spectrum.md) | sim | approved |
| 007 | [Pessoas importantes](007-notable-people.md) | sim | approved |
| 008 | [Notícias geopolíticas](008-news.md) | sim | approved |
| 009 | [Moeda, câmbio e economia](009-currency.md) | sim | approved |
| 010 | [Música](010-music.md) | sim | approved |
| 011 | [Vídeos de história](011-history-videos.md) | sim | approved |
| 012 | [Viagem no tempo](012-time-travel.md) | sim | approved |
| 013 | [Design system "Signal"](013-design-system.md) | não | done |
| 014 | [Todos os países ativos + camada de bandeiras](014-all-countries-active.md) | não | approved |
| 015 | [Perfil: como vive o povo](015-country-profile.md) | sim | approved |
| 016 | [História expandida](016-history-expanded.md) | sim | approved |
| 017 | [Idiomas oficiais e outros](017-languages.md) | sim | approved |
| 018 | [Ideologias e pensadores](018-ideologies.md) | sim | approved |

Plano de execução e checklist: [PLAN.md](PLAN.md). Avaliação de stack: [ADR-001-stack.md](ADR-001-stack.md).

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
