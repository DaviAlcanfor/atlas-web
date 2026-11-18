# 040 — Rodada de polimento 6 (nome das linhas de comércio, ⓘ direto, cursor)
Status: approved (o dono aprovou "faz o resto" em 2026-11-18) | Contrato: sem mudança | API: não

## Por quê
Pedidos do dono: (1) os arcos de comércio não dizem quem liga a quem; (2) explicações ficam em texto longo ou escondidas; (3) `cursor: pointer` aparece onde não há clique.

## Requisitos
- QUANDO "Comércio" está ligado ENTÃO uma legenda ao lado da coluna lista cada linha: "Brasil → China" + valor (exporta/importa em US$). Seta: → só exporta, ← só importa, ⇄ os dois. Mesma lista e ordem dos arcos (dados que o cliente já tem, `GET /v1/countries/{iso}/trade`).
- Os botões da coluna (camadas, Comércio, Estados, Viagem no tempo) e o título da legenda de comércio têm um ⓘ focável (componente `Hint`/`Tooltip` existente) com a explicação.
- Só elementos interativos usam `cursor: pointer`; controles desabilitados ficam com `default`.

## Contract delta consumido
Nenhum.

## Design
Legenda `.legend--trade` no aside da coluna (acessível, lista real). `RailButton` ganha o ⓘ como foco separado. Nenhuma lib nova; cores só via palette/variáveis.
Suposições: o globo tem `enablePointerInteraction={false}` (picking próprio), então não há hover na linha 3D: o nome vai na legenda. O "produto principal" não é por parceiro na API (só `top_exports` do país todo), então não entra na linha.

## Tarefas
- [x] `src/lib/tradeArcs.ts` + teste
- [x] Legenda de comércio + ⓘ na coluna
- [x] Auditoria de cursor
- [ ] PR com prints

## Decisões abertas
Produto por parceiro exigiria campo novo na API.
