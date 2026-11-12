# 008 — Notícias
Status: draft | Contrato: v1.2 | API: atlas-api/specs/008-news.md | Substitui: CR-2

## Requisitos
- Seção "Notícias" do país: até 20 manchetes dos últimos 7 dias, mais recentes primeiro: título, veículo, "há 3 h",
  selo de idioma (português sem selo; outros com "EN", "ES"...), link em nova aba.
- Vazio: "Sem notícias recentes" + link de busca do Google Notícias (o que existe hoje).
- `fetched_at` com mais de 24 h: aviso "atualizado há X".
- Página `#/news`: feed do mundo (resumos diários da Wikipedia, em inglês), um bloco por dia, com atribuição CC BY-SA e link.
- Nunca resumo por IA; título sempre texto puro.

## Contract delta consumido
```
NewsItem { id, title, url, outlet, language, published_at, countries: string[], origin: "gdelt"|"wikipedia" }
GET /v1/countries/{iso2}/news?limit= -> { items: NewsItem[], fetched_at: string|null }
GET /v1/news?date=&limit=            -> { items: [{ date, text, links: [{ title, url }] }], source: Source, fetched_at: string|null }
```

## Design
- `NewsList` (skeleton de 5 linhas enquanto carrega). Data relativa com `Intl.RelativeTimeFormat('pt-BR')`.
- Links: `target="_blank" rel="noopener noreferrer"`, URL passada por `safeHref`.
- `#/news`: rota no hash, igual à seleção de país.

## Tarefas
- [ ] zod + mock; `NewsList` no painel; página `#/news`; atribuição no rodapé
