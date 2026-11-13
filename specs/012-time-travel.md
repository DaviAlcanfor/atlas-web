# 012 - Viagem no tempo e mapa com estilo da época
Status: in progress (etapa 1 feita em 2026-11-13: slider, camada histórica e painel básico; faltam fatos da época e estilos) | Contrato: v2 | API: atlas-api/specs/012-historical-series.md (fontes pesquisadas: Cliopatria CC BY 4.0) | Executor: Opus

## Por quê
Um "relógio do tempo": slider de ano que troca o mapa para as fronteiras daquela época, mostra cada entidade como era, e muda o
**estilo do mapa** para lembrar a cartografia do período.

## Requisitos
- Slider no topo (régua com séculos, ticks nos anos de retrato, leitura "1815" / "300 a.C."); arrastar mostra o ano; soltar carrega o retrato
  mais próximo ("fronteiras de 1815"). Teclado: setas ±1 retrato, PageUp/PageDown ±1 século, Home/End. Botão "hoje" volta ao presente.
  URL: `?ano=1815` (preservado em `/pais/...` e compartilhável).
- Mapa: entidades daquele ano com a mesma matriz de pontos, cor estável por entidade (hash do `wikidata`); terra sem entidade registrada
  em pontos apagados com rótulo "sem Estado registrado nesta fonte" no hover. Transição entre retratos: cross-fade de 400 ms.
- Painel histórico ao clicar: nome da época, bandeira da época, capital, forma de governo, governante naquele ano, antecessores/sucessores
  (link para o país moderno), resumo e link Wikipedia. Fronteiras antigas são aproximadas: aviso fixo no painel.
- Pré-carregar os retratos vizinhos ao soltar o slider; cache em memória dos últimos 6.
- Atribuição no rodapé: "Fronteiras históricas: Cliopatria (Seshat Global History Databank), CC BY 4.0, simplificadas".

## Estilos por época
O tema "Signal" vira o tema do presente; cada época troca tokens de cor, o shader da terra, a gratícula e o fundo.
Implementação: `src/lib/eras.ts` com `{ id, from, to, palette, land: 'dots'|'ink'|'hatch'|'flat', graticule, background }`;
uniforms do `dotMaterial` ganham um modo (pontos / traço de tinta / hachura / chapado) e texturas procedurais (ruído de papel em shader,
sem imagens externas). Troca animada (cross-fade de tokens, 600 ms; sem animação com movimento reduzido).

| Época | Estilo | Terra | Grade | Fundo |
|---|---|---|---|---|
| até 1500 | manuscrito | traço de tinta sépia irregular, sem preenchimento forte | nenhuma | pergaminho escuro com ruído |
| 1500-1800 | carta náutica | hachura fina em tinta, costas reforçadas | linhas de rumo + rosa dos ventos no oceano | papel envelhecido |
| 1800-1945 | atlas impresso | cores chapadas de litografia, bordas em tinta | gratícula 10° fina | papel claro amarelado |
| 1945-1991 | Guerra Fria | contorno azul de planta técnica | gratícula forte | azul de planta |
| 1991-hoje | Signal (atual) | matriz de pontos ciano | gratícula 10° | abismo |

Contraste mínimo AA para texto do painel em todos os temas (o painel mantém fundo próprio).

## Contract delta consumido (v2)
Ver a spec da API: `geometry_url` TopoJSON (pode ser URL absoluta), feições `{ name, wikidata, polity_id }`,
`PolityDetail += { wikidata, flag, capital, government }`, `GET /v1/polities/{id}/leaders?year=`.

## Tarefas
- [x] slider + estado `ano` na URL + carregamento/cache de retratos. Etapa 1 (2026-11-13): `<input type="range">` nativo sobre a
      LISTA de anos de retrato (setas, Home/End e PageUp/PageDown de graça), barra no canto inferior esquerdo em vez do topo,
      `?ano=` na URL (um ano qualquer cai no retrato mais próximo), cache dos últimos 6. GeoJSON direto (CR-005), sem TopoJSON.
      Não feito ainda: régua com séculos, pré-carregar vizinhos, cross-fade entre retratos, `?ano` preservado em `/pais/...`.
- [x] camada histórica no globo (mesmo picking) + painel histórico BÁSICO: nome pt-BR, existência, "fazia parte de", Wikipédia,
      aviso de fronteira aproximada, link para o país de hoje quando o nome coincide. Terra sem Estado registrado: pontos apagados
      (sem o rótulo no hover). Cor estável por entidade (hash do nome). Bandeira, capital, governante e antecessores da época
      dependem da etapa 2 da API (`etl wikidata-polities`).
- [ ] temas por época (`eras.ts`, modos do shader, cross-fade) + screenshots de cada época
- [x] atribuição (barra do tempo e painel); testes: bordas sem duplicata, cor estável, conversão do retrato (`timeTravel.test.ts`)
