# 009 - Moeda, câmbio e economia comparável
Status: approved | Contrato: v1.2 | API: atlas-api/specs/009-currency.md | Executor: Sonnet (UI), Opus (gráficos de comparação)

## Por quê
O chip da moeda no painel deve ser clicável e com hover (como o regime): hover explica a moeda; clique abre uma tela de câmbio
para comparar com outras moedas e ver o estado da moeda e da economia do país, comparável com outros países.

## Requisitos
- Hover no chip da moeda: tooltip com nome, código ISO, símbolo, cotação de hoje contra USD e variação em 12 meses.
- Clique: abre `#/moeda/<CODE>?vs=USD,EUR,BRL` (rota de página inteira sobre o globo, com voltar).
- Bloco **Câmbio**: cotação contra até 4 moedas escolhidas (padrão USD, EUR, BRL), conversor nos dois sentidos, gráfico de linha
  1a / 5a / máx. com as moedas normalizadas em base 100 na data inicial (assim moedas de escalas diferentes cabem no mesmo gráfico).
- Bloco **Estado da moeda**: variação 1a/5a contra USD, volatilidade (desvio padrão das variações diárias, 1 ano), maior queda,
  regime cambial se houver fonte, inflação anual. Cada número com fonte e data.
- Bloco **Economia do país**: PIB, PIB per capita (PPP), crescimento do PIB, inflação, desemprego, dívida pública/PIB,
  conta corrente/PIB, reservas, Gini. Série de 20 anos por indicador (sparkline).
- **Comparar países**: seletor de até 4 países; tabela + gráfico lado a lado dos mesmos indicadores; link compartilhável
  (`#/moeda/BRL?cmp=AR,MX,CL`).
- Países que usam a mesma moeda listados e clicáveis (euro, franco CFA, dólar).
- Sempre: "cotação de referência, não é preço de casa de câmbio"; sem dado = "sem dados" (nunca interpolar).

## Contract delta consumido (v1.2)
```
GET /v1/currencies/{code}                         -> { code, name, symbol, countries: string[],
                                                       rates: { date, base, items: [{ code, rate }] }|null,
                                                       stats: { change_1y, change_5y, volatility_1y, max_drawdown_1y }|null,
                                                       sources: Source[] }
GET /v1/currencies/{code}/history?vs=&from=&to=   -> { base, vs: string[], items: [{ date, rates: { [code]: number } }], source: Source }
GET /v1/countries/{iso2}/economy                  -> { indicators: [{ id, label, unit, value, year, source_id,
                                                       series: [{ year, value }] }], sources: Source[] }
GET /v1/economy/compare?countries=BR,AR&ids=      -> { countries: string[], indicators: [{ id, label, unit,
                                                       values: { [iso2]: { value, year }|null } }], sources: Source[] }
```

## Design
- Rotas no hash (como `#c=BR`), ou rotas reais se a migração para Next.js (ADR-001) acontecer antes.
- Gráficos: SVG próprio com eixos e hover (uma lib só se passar de 2 tipos de gráfico; carregar a skill `dataviz` antes de desenhar).
- Formatação: `Intl.NumberFormat('pt-BR', { style: 'currency', currency })`, percentuais com 1 casa.
- Tooltip reaproveita o componente da spec 004.

## Tarefas
- [ ] zod + mocks a partir das amostras da API
- [ ] chip clicável/hover; página da moeda com câmbio + conversor + gráfico base 100
- [ ] blocos Estado da moeda e Economia; comparação de países
