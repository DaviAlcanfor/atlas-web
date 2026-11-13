# 013 - Design system "Signal" e animações
Status: done (revisado em 2026-11-13) | Contrato: não muda

## Por quê
O visual atual (cards arredondados com gradiente, 5 cores de acento, Inter/Space Grotesk) parece template de IA.
Referências do dono do projeto: continentes em matriz de pontos, grade fina de coordenadas, ciano gelo sobre azul-marinho quase preto,
vermelho só para sinal (marcadores, alerta, seleção), leve brilho holográfico, perspectiva de mapa de operações.

## Leitura de design
Aplicativo de atlas interativo para exploradores curiosos, linguagem de cartografia HUD / inteligência de sinais,
implementado com tokens CSS nativos + shaders WebGL + movimento em CSS. Tema único escuro (é uma cena espacial).
Dials: variância 6, movimento 6, densidade 6.

## Regras
- **Cor**: base neutra fria (abismo, oceano, painel) + **ciano gelo** como cor de dado (pontos de terra, linhas, números)
  + **vermelho sinal** como ÚNICO acento (seleção, marcadores, guerra na timeline, foco de alerta). Nada de roxo, âmbar, coral, verde.
  Tokens em `src/lib/palette.ts` (fonte única), espelhados em CSS como `--c-*`.
- **Forma**: tudo reto. Raio 2px só em botões/inputs. Bordas de 1px. Painéis com "cantoneiras" (brackets) em vez de sombra/gradiente.
- **Tipo**: Geist (texto e títulos) + Geist Mono (números, coordenadas, rótulos curtos). Números sempre em mono com `tabular-nums`.
  Rótulo em caixa alta só onde organiza dado (nome de bloco no painel), nunca decorativo.
- **Ícones**: Phosphor (`@phosphor-icons/react`, peso `light`, 16px). Proibido desenhar SVG de ícone à mão.
- **Globo**: terra em matriz de pontos (dot-matrix por lat/lng no shader, não por pixel de tela), oceano quase preto, gratícula 10°
  em ciano 10%, fronteiras ciano 35%, país em foco com pontos mais densos/claros + anel de pulso vermelho, bandeira (spec 002) mantida.

## Movimento (cada um com motivo)
| Animação | Motivo |
|---|---|
| Entrada do globo: pontos acendem + grade aparece (600 ms) | estado inicial → pronto |
| Seleção: anel vermelho pulsando no país (3 pulsos) + câmera voa | feedback de onde está o foco |
| Painel: revelação por máscara da direita com linha de varredura (420 ms) | transição de estado (abriu) |
| Blocos do painel em cascata (40 ms entre blocos) | hierarquia de leitura de cima pra baixo |
| Números contam até o valor (700 ms) | chama atenção para os dados principais |
| Linha da timeline desenha de cima pra baixo, pontos aparecem em sequência | narrativa cronológica |
| Hover em botão: cantoneiras expandem 2px; `:active` desce 1px | feedback tátil |
Tudo desligado com `prefers-reduced-motion: reduce`. Só `transform`/`opacity`/`clip-path`. Contagem de números escreve direto no DOM via ref
(sem re-render por frame).

## Tarefas
- [x] tokens novos em `palette.ts` (aliases antigos só até o globo migrar)
- [x] fontes Geist/Geist Mono; CSS do painel (hairlines, cantoneiras `.bracketed`, números em mono), readout no topo à esquerda, toggle segmentado embaixo à esquerda, rodapé, loading
- [x] ícones Phosphor (`@phosphor-icons/react` 2.1.10, import por ícone: o barril tem ~9000 módulos e travava os testes)
- [x] animações do painel (máscara + varredura + cascata), `CountUp` nos números, linha da timeline desenhando; tudo em `@media (prefers-reduced-motion: no-preference)`
- [x] globo: shader de pontos, gratícula, anel de pulso, entrada; remover aliases de cor antigos
- [x] `npm run smoke` + screenshots antes/depois

## Resultado (globo)
- Terra em matriz de pontos (`src/lib/dotMaterial.ts`): grade em lat/lng no shader (presa ao globo), 0,9° no zoom padrão,
  espaçamento cai pela metade a cada oitava de zoom (uniform `uZoom`, troca global, sem costuras); pontos redondos com borda
  suave e brilho leve; sub-pixel vira cobertura média (sem cintilação). Um material por estado (sem conteúdo, com conteúdo,
  hover, selecionado 0,7× mais denso, uma por cor de regime). Bandeira (spec 002) desenhada sobre os pontos no mesmo shader.
- Gratícula 10° própria (LineSegments única, amostrada a cada 1°; a do three-globe fica sob os polígonos e o `geoGraticule`
  do d3 desenha meridianos como cordas de 90°). Atmosfera 0,12; estrelas mais discretas; cores de linha respeitam o alfa dos tokens.
- Seleção: 3 pulsos vermelhos (`ringsData`) do centróide do maior polígono (o de FR cai no Atlântico por causa da Guiana),
  passando a fronteira; reduced motion = anel estático. Entrada: pontos acendem em ordem aleatória + gratícula aparece (600 ms).
- Acessores do `ReactGlobe` estáveis (antes `customThreeObject` etc. eram arrow inline a cada render).
- Aliases de cor antigos e `hatch` removidos de `palette.ts`; `hatchMaterial.ts` apagado.
- Limitação: linhas WebGL têm 1 px (anel discreto sobre bandeiras com vermelho).
