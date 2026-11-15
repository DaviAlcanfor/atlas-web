# 028 - Rodada de polimento 4 (controles inferiores, carregamento do globo)
Status: done (verificado local com screenshots desktop e mobile; README pendente, último item) (aprovada pelo dono em 2026-11-15: "pode fazer oq ta pendente agora") | Repos: web | Contrato: sem mudança | API: não depende

## Pedidos e o que fazer
| Pedido | O que fazer |
|---|---|
| Itens do canto inferior esquerdo ocupam muito espaço (horizontal + vertical) | Uma coluna vertical só, à esquerda, com ícones (Phosphor, weight light). Texto some; cada ícone tem rótulo no hover/foco (`Tooltip`) e `aria-label`. Sub-controles (legenda, ranking, modo das bandeiras dos estados) abrem ao lado da coluna. |
| Dá pra usar o site sem o globo (entrada direta em `/pais/...`: o painel e os controles funcionam enquanto o globo não chega) | O carregamento do globo bloqueia a tela inteira até o primeiro quadro. Depois de 20 s aparece "Entrar sem o globo" (saída para hardware lento). Se o globo falhar, o botão é "Continuar sem o globo". |
| Tela de carregamento: deixar mais legal | Lista de etapas com marcação (mapas, países da API, glossário, globo), barra e porcentagem, pontos do mapa acendendo, curiosidades que trocam a cada 8 s. Sai a frase rotativa de mensagens. |
| Sobreposição: a mensagem do carregamento e os links do canto inferior ocupam o mesmo lugar | Com o bloqueio, a mensagem fica centralizada e os controles ficam atrás dela até o globo chegar. |
| README atualizado | Último item, depois de tudo. Fora desta rodada. |

## Requisitos
- QUANDO o globo está carregando, ENTÃO nenhum controle do mapa ou do painel responde, e a tela mostra o carregamento.
- QUANDO passam 20 s sem o primeiro quadro, ENTÃO aparece o botão "Entrar sem o globo" (o site segue utilizável).
- QUANDO o WebGL falha, ENTÃO aparece a mensagem de erro e o botão "Continuar sem o globo".
- QUANDO a coluna inferior está aberta, ENTÃO cada ícone tem rótulo acessível e a camada ativa aparece `aria-pressed`.

## Design
- Coluna: 40 px por botão, borda e fundo do painel, separadores entre grupos: camadas (5) | Estados (+2 modos de bandeira quando ligado) | páginas (Viagem no tempo, Notícias, Economia, Glossário).
- Mobile (≤ 700 px): mesma coluna, no topo à esquerda, abaixo da busca.
- Carregamento: tela cheia (`z` acima do chrome), sem modo "ao lado do painel".

## Tarefas
- [x] Coluna vertical com ícones e rótulos (`LayerToggle`, `Shell`)
- [x] Legenda/ranking/modo de bandeiras ao lado da coluna
- [x] Carregamento bloqueante + "Entrar sem o globo" / "Continuar sem o globo"
- [x] Carregamento redesenhado (etapas, curiosidades rotativas)
- [x] Remover o modo "ao lado" e o CSS antigo do carregamento
- [x] Typecheck, testes (69), build (204 páginas), screenshots (desktop e mobile)
- [ ] README (último)

## Decisões abertas
- Nenhuma. Escolhas tomadas: a entrada direta também bloqueia (o globo é a entrada do Atlas); o escape de 20 s mantém o site utilizável em máquinas lentas.
