# 008 - Notícias geopolíticas do mundo e por país
Status: approved | Contrato: v1.2 | API: atlas-api/specs/008-news.md | Substitui: CR-2 | Executor: Sonnet

## Por quê
Uma página de notícias geopolíticas do mundo (prioridade do dono) e a aba Notícias do país. A seleção do que é geopolítico é feita
na API por um classificador (Jev, TypeSafe), não à mão.

## Requisitos
- Página `#/noticias`: feed do mundo, mais recentes primeiro, agrupado por dia. Cada item: título, veículo, "há 3 h", selo de idioma,
  países envolvidos (bandeirinhas clicáveis que voam até o país), tipo do evento (conflito, diplomacia, eleição, sanção, acordo...).
- Filtros na página: região, tipo de evento, idioma; busca por país.
- Aba "Notícias" do país: as do feed que citam o país, até 20, últimos 7 dias.
- Mostrar a confiança da classificação de forma discreta (ex.: itens com probabilidade 0,5-0,7 ficam numa seção "talvez relevante").
- Nunca resumo por IA; título sempre texto puro; link abre o original em nova aba (`rel="noopener noreferrer"`).
- Vazio: "Sem notícias recentes" + link para Google Notícias. `fetched_at` > 24 h: aviso "atualizado há X".

## Contract delta consumido (v1.2)
```
NewsItem { id, title, url, outlet, language, published_at, countries: string[],
           event_type: "conflict"|"diplomacy"|"election"|"sanctions"|"agreement"|"protest"|"coup"|"economy_policy"|"other",
           geopolitical_p: number /* 0..1, Jev */, origin: "gdelt" }
GET /v1/news?region=&type=&lang=&country=&min_p=&limit=&before= -> { items: NewsItem[], fetched_at: string|null, next: string|null }
GET /v1/countries/{iso2}/news?limit=                             -> { items: NewsItem[], fetched_at: string|null }
```

## Tarefas
- [ ] zod + mocks; página `#/noticias` com filtros e paginação (`before`)
- [ ] aba Notícias do país; atribuição GDELT no rodapé
