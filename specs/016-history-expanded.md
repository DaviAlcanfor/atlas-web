# 016 - História expandida e expansível
Status: in progress (fases 1 e 2 feitas; falta filtro por tipo e detalhe do evento) (revisado em 2026-11-13) | Contrato: v1.2 | API: atlas-api/specs/016-history-expanded.md | Executor: Sonnet

## Por quê
A história do Brasil hoje tem 5 eventos. Quero uma história mais elaborada, organizada por períodos, onde cada parte abre para mais detalhe.

## Requisitos
- A seção História mostra **períodos** (ex.: "Período pré-colonial", "Colônia", "Império", "República Velha", "Era Vargas",
  "Ditadura militar", "Nova República"), cada um com intervalo de anos, 1-2 frases de resumo e o número de eventos.
- Clicar num período expande a linha do tempo dele (componente da spec 001) com todos os eventos.
- Clicar num evento expande o detalhe: resumo maior (até 3 parágrafos), pessoas ligadas (links para a spec 007 quando houver),
  imagem com crédito se houver, link "ler na Wikipedia".
- Filtro por tipo (política, guerra, tratado, cultura, economia) que vale para todos os períodos.
- Meta de conteúdo: pelo menos 6 períodos e 40 eventos para os países com conteúdo curado; para os demais, o que a fonte automática der
  (com o selo "gerado de fontes abertas, não revisado").

## Contract delta consumido (v1.2)
```
Period      { id, title, year_start, year_end: int|null, summary, event_count }
EventDetail = Event + { long_summary: string|null, people: [{ id, name }], image: Image|null, wikipedia_url: string|null, reviewed: bool }
GET /v1/countries/{iso2}/history                 -> { periods: Period[], sources: Source[] }
GET /v1/countries/{iso2}/history/{period_id}     -> { period: Period, events: EventDetail[] }
```

## Fase 1 (2026-11-12): resumo da história, CR-004
Seção História: resumo em texto corrido (3 linhas + "ler o resumo inteiro"), depois "Períodos" como `<details>` nativos com anos,
depois os marcos curados de sempre. Fonte com link para a revisão exata da Wikipédia (CC BY-SA 4.0). Endpoint ausente/erro = some.
Componente `src/components/HistorySummary.tsx`; mock `src/api/mocks/history.json` (BR, JP, ML da API local).

## Tarefas
- [x] fase 1: resumo + períodos (CR-004)
- [ ] zod + mocks; `PeriodList` (acordeão, `aria-expanded`), reusar `Timeline`; detalhe do evento; filtro por tipo
