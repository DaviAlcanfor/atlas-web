# 001 — História como linha do tempo
Status: done | Repos: web | Contrato: não muda (usa `timeline: Event[]`)

## Por quê
A seção de história hoje é uma lista; quero a estilização clássica de linha do tempo, numa linha mesmo.

## Requisitos (critérios de aceite)
- QUANDO abro um país com eventos ENTÃO vejo uma linha vertical com um ponto por evento, ano à esquerda, título + resumo à direita.
- A cor/forma do ponto indica `kind` (político, guerra, tratado, cultural, econômico, outro), com legenda.
- `precision` aparece no ano: "c. 1500" (circa), "década de 1920", "séc. XV". Anos negativos como "300 a.C.".
- Eventos com `year_end` mostram o intervalo e um traço mais grosso na linha.
- Eventos longos (> 3 linhas de resumo) ficam recolhidos com "ler mais" (`<details>` nativo).
- Em 400 px de largura não há scroll horizontal; com `prefers-reduced-motion` não há animação de entrada.

## Já existe (2026-11-11)
Linha vertical com ponto colorido por `kind` (`.timeline` em `styles.css`), formatação de precisão e a.C. em `years.ts`.
Falta: legenda das cores, intervalo com traço destacado, "ler mais" e ordem garantida.

## Design
CSS puro (pseudo-elemento `::before` para a linha, `<ol>` semântica). Cores de `kind` em `palette.ts`.
Formatação de ano: reaproveitar/estender `src/lib/years.ts`.
Opcional depois: modo horizontal (régua) quando a 012 (viagem no tempo) existir, sincronizado com o slider de ano.

## Tarefas
- [x] web: legenda de cores, intervalo destacado (`.is-span`), "ler mais" (> 220 caracteres) no `Timeline` do `CountryPanel`; precisão já coberta por `years.ts` + testes
- [ ] web: usar o mesmo `Timeline` no painel histórico (fase 3)
