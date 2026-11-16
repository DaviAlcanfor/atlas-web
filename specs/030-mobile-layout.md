# 030 - Layout para celular
Status: done (pedido direto do dono em 2026-11-16: "pensar o melhor layout pro mobile, reorganizar, hoje está muito difícil de usar") | Repos: web | Contrato: sem mudança | API: não depende

## Problemas (screenshots 390x844 de 2026-11-16)
| Problema | O que fazer (≤ 700 px) |
|---|---|
| A coluna de camadas com rótulos ocupa ~45% da tela e cobre o globo | Barra no topo: botão "Camadas" (ícone + camada atual) à esquerda e busca ao lado. A coluna abre como menu abaixo do botão e fecha ao escolher |
| Legenda / ranking abrem ao lado da coluna, sem espaço | Embaixo, largura cheia, altura máxima 38% com rolagem |
| Título grande "PAÍS Brasil" repete o nome do painel | Título menor (20 px) abaixo da barra; some quando um painel está aberto |
| Painel do país fixo em 58% embaixo, sem como ver mais; o globo continua centrado atrás dele | Painel em 50% da altura com botão "Expandir/Recolher" (tela cheia); o globo encolhe para a metade de cima e o país fica visível |
| Busca embaixo some atrás do painel | Busca no topo |
| Botões de 32 px são pequenos para o dedo | 44 px no menu |

## Requisitos
- QUANDO a tela tem ≤ 700 px, ENTÃO nenhum controle cobre mais que a barra do topo enquanto o menu está fechado.
- QUANDO o visitante escolhe uma camada ou página no menu, ENTÃO o menu fecha.
- QUANDO um país está aberto, ENTÃO o globo ocupa a metade de cima e o painel a de baixo; "Expandir" leva o painel à tela cheia.
- Desktop sem mudança.

## Tarefas
- [x] Botão de menu + estado aberto/fechado (`LayerToggle`)
- [x] CSS mobile: barra do topo, menu, legenda embaixo, título menor, globo na metade de cima
- [x] Painel: Expandir/Recolher só no celular (`CountryPanel`)
- [x] Typecheck, testes (73 de 74; a falha de `v11.test.tsx` "Governantes" já existe na main), build, screenshots 390x844 (`scripts/mobile-shots.ts`)

## Fora desta rodada
- Arrastar o painel com o dedo (o botão resolve; gesto só se fizer falta).
- Viagem no tempo no celular: o painel histórico cobre a barra do tempo enquanto aberto (fechar o painel devolve a barra).
