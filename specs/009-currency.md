# 009 — Moeda: página de comparação
Status: draft | Contrato: v1.2 | API: atlas-api/specs/009-currency.md

## Requisitos
- Clicar na moeda no painel abre `#/currency/<CODE>`: cotação de hoje contra USD, EUR, BRL e uma moeda escolhida;
  conversor nos dois sentidos; gráfico 1 ano (opções 5 anos e máx.).
- Poder de compra (PPP) em uma frase, quando existir.
- Países que usam a mesma moeda (clicáveis).
- Data e fonte da cotação sempre visíveis + "cotação de referência, não é preço de casa de câmbio".
- Moeda sem cotação: dizer isso e mostrar só o PPP.

## Contract delta consumido
```
GET /v1/currencies/{code}                       -> { code, name, symbol, countries, rates: { date, base, items: [{ code, rate }] }|null,
                                                     ppp: { value, year, source_id }|null, sources }
GET /v1/currencies/{code}/history?vs=&from=&to= -> { base, vs, items: [{ date, rate }], source }
```

## Design
- Conversor: `<input type="number">` + `Intl.NumberFormat('pt-BR', { style: 'currency' })`.
- Gráfico: SVG de uma linha feito à mão (eixo, hover com valor). Sem lib de gráfico enquanto for só uma série.

## Tarefas
- [ ] zod + mock; página; conversor; gráfico; link a partir do chip de moeda
