# 024 - Estados: bandeira e dados por subdivisão
Status: draft | Contrato: v1.3 (delta abaixo) | API: atlas-api/specs/024-subdivisions-data.md (a escrever junto)

## Por quê
O dono pediu a bandeira de cada estado no globo e "informações por estado" (quebra maior que o país). Os arquivos
`public/data/admin1/<ISO2>.geojson` já trazem `wikidataid` em cada estado (Natural Earth admin-1), então a junção com dados é direta.

## Fontes (hipóteses: ler termos e licença antes de codar, regra do AGENTS.md da API)
| Dado | Fonte | Licença |
|---|---|---|
| Bandeira do estado | Wikidata P41 -> arquivo no Commons, miniatura PNG `upload.wikimedia.org/.../thumb/...` (CORS liberado) | Wikidata CC0; cada imagem tem a sua (maioria domínio público); guardar autor + licença por arquivo |
| População, área, capital, governador, sigla | Wikidata P1082 (com data), P2046, P36, P6, P300 (ISO 3166-2) | CC0 |
| IDH subnacional | Global Data Lab, SHDI (`globaldatalab.org/shdi`) | checar termos (exige atribuição) |
| Brasil, mais fino | IBGE API de agregados (`servicodados.ibge.gov.br/api/v3/agregados`): PIB estadual, população do Censo 2022 | dados públicos, citar IBGE |

A web continua sem chamar Wikidata/IBGE: tudo passa pela API (ETL guarda; endpoint serve).

## Requisitos
- QUANDO o botão "Estados" está ligado e o usuário passa o mouse num estado ENTÃO o readout mostra nome + bandeira pequena do estado.
- QUANDO o usuário clica num estado ENTÃO o painel mostra uma seção "Estado: X" no topo (bandeira, capital, população com ano,
  área, governador, IDH se houver, fontes) com um "voltar ao país"; a URL vira `/pais/br/<iso3166-2>` (ex.: `/pais/br/sp`).
- QUANDO "Estados" está ligado ENTÃO cada estado pode mostrar a própria bandeira no território (mesma técnica da camada Bandeiras:
  atlas por país, carregado só ao ligar). Sem bandeira = pontos.
- Sem dado = "sem dados". Nunca inventar.

## Contract delta (proposta, CR a aprovar)
```
GET /v1/countries/{iso2}/subdivisions -> { items: [ { id: "BR-SP", wikidata_id: "Q175", name: "São Paulo", capital: str|null,
  population: {value, year, source_id}|null, area_km2: num|null, head: {name, office, since}|null, hdi: {value, year, source_id}|null,
  flag: {url, credit, license}|null } ], sources: [Source] }
```

## Tarefas
- [ ] API: ler termos (Wikidata, Commons, GDL, IBGE) e citar na spec da API
- [ ] API: ETL `wikidata-subdivisions` (SPARQL em lotes por país, com teto de espera do limite de taxa: ver o travamento do ETL de idiomas)
- [ ] API: migração + endpoint + testes + fixture
- [ ] Contrato v1.3 (dono)
- [ ] Web: readout com bandeira do estado; seção "Estado" no painel; rota `/pais/[iso2]/[sub]`
- [ ] Web: bandeiras dos estados no globo (atlas por país)

## Decisões abertas
- Quais países primeiro? Proposta: todos os que têm arquivo admin-1 (240), já que o Wikidata cobre quase todos.
