# 015 - Perfil do país: como vive o povo
Status: done (no ar) (revisado em 2026-11-13) | Contrato: v1.2 | API: atlas-api/specs/015-country-profile.md | Executor: Sonnet

## Por quê
População, área, densidade e regime não dizem como o país está nem como é o povo. Quero indicadores de vida, sociedade e
economia, comparáveis com a média do mundo e da região.

## Requisitos
- Nova seção "Como vive o povo" logo abaixo dos 4 KPIs, em 4 grupos (cada um recolhível, abertos por padrão os 2 primeiros):
  - **Vida**: expectativa de vida, mortalidade infantil, IDH, idade mediana, fecundidade.
  - **Sociedade**: urbanização, alfabetização, anos de estudo, acesso à internet, homicídios por 100 mil, religiões (composição), grupos étnicos.
  - **Desigualdade e renda**: PIB per capita PPP, Gini, pobreza extrema (% abaixo de US$ 2,15/dia), desemprego.
  - **Ambiente**: emissões de CO2 per capita, % de energia renovável, área florestal.
- Cada indicador: valor + ano + fonte, e uma régua discreta que mostra a posição do país entre o mínimo e o máximo do mundo
  com a mediana mundial marcada (sem trilho preenchido: só um tick). Hover: ranking ("34º de 190") e média da região.
- Religiões e etnias: barra empilhada horizontal com os 5 maiores grupos + "outros", só quando a fonte dá percentuais.
- Sem dado = linha omitida dentro do grupo; grupo vazio = grupo omitido.

## Contract delta consumido (v1.2)
```
GET /v1/countries/{iso2}/profile -> { groups: [{ id: "life"|"society"|"income"|"environment",
    indicators: [{ id, label, unit, value, year, source_id, rank: int|null, rank_of: int|null,
                   world: { min, median, max }|null, region_avg: number|null }] }],
  composition: { religion: [{ label, share }]|null, ethnicity: [{ label, share }]|null, year: int|null, source_id: string|null },
  sources: Source[] }
```

## Tarefas
- [x] zod + mocks; componente `IndicatorRow` (valor, régua com tick, hover de ranking); `CompositionBar`; grupos recolhíveis (`<details>`)

Feito no front (branch `feat/v1.2-front`): `src/components/Profile.tsx` (`IndicatorRow`, `CompositionBar`, grupos `<details>`), `src/lib/profile.ts` (texto de ranking: indicadores "ruins" contam do menor valor, ex. "5º menor de 177"; composição = top 5 + "outros" somando só os grupos listados), ⓘ por indicador em `INDICATOR_EXPLANATIONS`. Endpoint ausente (produção v1.1) = seção oculta.
