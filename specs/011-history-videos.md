# 011 — Vídeos de história
Status: draft | Contrato: v1.2 | API: atlas-api/specs/011-history-videos.md

## Requisitos
- Até 3 cards (thumbnail, título, canal, idioma) dentro da seção "História".
- Nada do YouTube carrega antes do clique (privacidade e desempenho); no clique, o card vira o player.

## Contract delta consumido
`CountryDetail.videos: [{ youtube_id, title, channel, lang }]`

## Design
- Thumbnail `https://i.ytimg.com/vi/<id>/hqdefault.jpg`; player `https://www.youtube-nocookie.com/embed/<id>?autoplay=1`.
- `youtube_id` validado por regex (`^[A-Za-z0-9_-]{11}$`) antes de montar qualquer URL.

## Tarefas
- [ ] zod + mock; `VideoCard` com facade
