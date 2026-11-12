# 010 — Música
Status: draft | Contrato: v1.2 | API: atlas-api/specs/010-music.md

## Requisitos
- Seção "Música" com duas partes de nome honesto:
  1. "Nasceram aqui": gêneros originados no país, com link.
  2. "Mais ouvidos aqui": top artistas e a fatia de cada gênero entre eles (barras), com fonte, data e aviso de viés da plataforma.
- Parte sem dado = omitida.

## Contract delta consumido
```
GET /v1/countries/{iso2}/music -> { origin_genres: [{ id, name, wikipedia_url }],
                                    popular: { artists: [{ name, url }], genres: [{ name, share }], date, source }|null }
```

## Tarefas
- [ ] zod + mock; seção Música (barras horizontais em CSS, largura = `share`)
