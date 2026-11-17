# 035 - Rodada de polimento 5 (lista do dono de 2026-11-17)
Status: done | Repos: web | Contrato: sem mudança | API: não depende

Itens da lista de melhorias que não precisam de API nova nem de decisão. O resto da lista está triado em `PLAN.md`
("Lista de 2026-11-17").

## O que entrou
| Pedido | O que foi feito |
|---|---|
| Tabelas do chat desformatadas | `Markdown.tsx` lê tabelas (`| a | b |`, alinhamento pela linha `|---:|`), com rolagem horizontal; teste com o exemplo do dono |
| Chat fecha ao clicar fora | No desktop o chat abre sem bloquear o resto (o globo continua usável); só fecha no X ou no Esc. No celular continua tela cheia |
| Títulos das seções pouco destacados | `.psec h3`: 11 px cinza para 13 px, peso 600, cor do texto |
| Foco da Rússia | A câmera mira 57° N, 55° L (entre Moscou e os Urais), não o centroide na Sibéria (`FOCUS` em `Globe.tsx`) |
| Países perto dos polos "fogem" ao selecionar | A câmera não mira acima de 62° de latitude (Groenlândia, Svalbard, Antártida ficam à vista) |
| Destacar o país ligado pela linha comercial | Com os arcos ligados, os parceiros ficam na cor do arco (`palette.arcTo`); o selecionado mantém a sua |
| Hover no estado com governador | O card do hover mostra "Governador: Nome · desde 2023" quando a API tem o dado (BR, EUA, Índia) |

## Fora desta rodada (ver PLAN)
- Foto no hover do estado: a API não tem foto do governador; precisa de campo novo e fonte com licença (Commons).
- Bugs da Groenlândia e da viagem no tempo: precisam de investigação com reprodução.
