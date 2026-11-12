# 014 - Todos os países com cara de clicáveis + camada de bandeiras
Status: done (parte 1 e parte 2) | Repos: web | Contrato: não muda | Executor: Sonnet (parte 1), Opus (parte 2)

## Por quê
Os 196 países têm dados na API (todos têm `flag_url`, regime em 153, governantes em 196), mas no globo os que não têm
`has_content` aparecem com pontos escuros (`iceDim`) e parecem desativados. O dono do projeto quer todos com aparência de clicáveis.
`has_content` hoje só diz "tem timeline curada"; virou um detalhe, não um estado visual.

## Requisitos
- Parte 1: QUANDO o globo carrega ENTÃO todo país que a API conhece usa o mesmo material de pontos "ativo" (`ice`).
  Só território que a API não conhece (sem ISO2, ex.: Somalilândia) fica `iceDim`.
- Parte 1: o hover mostra uma prévia: nome + bandeira pequena no readout do topo (`InfoCard`), sem esperar o clique.
- Parte 1: o toggle "Com conteúdo" vira "Padrão" (o realce passa a ser só da camada "Regime político").
- Parte 2: nova camada no toggle, "Bandeiras": TODOS os países pintados com a própria bandeira nos pontos ao mesmo tempo.

## Design
- Parte 1: em `Globe.tsx`, a regra `filled = contentIds.has(id)` passa a `apiIds.has(id)`. Prévia: `InfoCard` recebe `flagUrl`
  (vem de `/v1/countries`? Não: `CountrySummary` não tem `flag_url`. Usar `https://flagcdn.com/w80/<iso2 minúsculo>.png`, mesmo host já
  aceito na spec 002, montado por `flagPngUrl` a partir do ISO2; validar ISO2 com `^[A-Z]{2}$`).
- Parte 2: atlas de texturas: um canvas 2048x2048 com as 196 bandeiras (`w80`, grade 16x13), carregado uma vez quando a camada é ligada.
  Um único `ShaderMaterial` recebe o atlas + por país um uniform/atributo com (célula do atlas, bbox do maior polígono). Como hoje o material
  é por estado e não por país, a forma mais barata é um atributo de vértice `aFlagCell` + `aFlagBox` gravado na geometria de cada país
  (three-globe cria uma geometria por polígono). Medir frame time antes/depois (meta: < 15% pior no swiftshader).

## Tarefas
- [x] parte 1: material ativo para todos os `apiIds`; toggle "Padrão"; prévia de bandeira (`flagPreviewUrl`, ISO2 validado) no readout do hover; screenshots (em mock só 9 países são conhecidos, então só eles ficam ativos)
- [x] parte 2: atlas de bandeiras + material da camada; medir performance; screenshots

## Resultado (parte 2)
Feito em 2026-11-12 (P3, branch `feat/flag-layer`).
- Toggle: "Padrão | Regime político | Bandeiras" (`LayerId = 'flags'`). Ao ligar a camada, `loadFlagAtlas` (`src/lib/flagMaterial.ts`)
  baixa `https://flagcdn.com/w80/<iso2>.png` de cada país que a API conhece (8 por vez, falha = país fica só com pontos) e desenha cada
  bandeira esticada numa célula 80x80 de um canvas 1280 x (80 x linhas) (16 colunas; 196 países = 13 linhas, 1280x1040).
  O canvas fica em memória na sessão (religar a camada é instantâneo); a `CanvasTexture` (sem mipmaps, mesma razão da spec 002) e os
  materiais são criados a cada ativação e descartados ao sair (com 1 s de atraso, depois do three-globe trocar os materiais).
- Material: o mesmo shader da spec 002 (`createFlagMaterial`), com um uniform novo `uCell` (célula no atlas, recuada meio texel para o
  filtro linear não ler a vizinha). Em vez de atributos de vértice, **um material por país** compartilhando os mesmos uniforms de
  textura/mix/intro/zoom: o three.js compila um só programa (mesmo código) e por país só troca `uBox`/`uCell`. As draw calls não mudam
  (o three-globe já faz um mesh por país) e evita mexer nas geometrias que o three-globe cria. Medido abaixo: dentro da meta.
- bbox = maior polígono (`flagBox`, com a volta no antimeridiano); ilhas/exclaves fora dela ficam com pontos normais.
- Carregando: o globo fica com a cara da camada Padrão e o toggle mostra "Carregando bandeiras…" (`role=status`). Depois, fade de 300 ms
  (sem fade com `prefers-reduced-motion`). Hover: pontos mais claros (`iceBright`) sobre a bandeira.
- País selecionado: continua a bandeira w640 da spec 002 (pontos mais densos) por cima; enquanto ela carrega, fica a do atlas.
- Performance (swiftshader, 1061x773, vista inicial, drag de 120 passos, `next dev`, 3 rodadas alternadas, mediana / p95 do frame):
  Padrão 183 / 200, 200 / 233, 200 / 217 ms; Bandeiras (todos os ~180 países com bandeira) 200 / 267, 200 / 217, 200 / 233 ms.
  Média: mediana +3% (194 -> 200 ms), p95 +10% (217 -> 239 ms). Meta (< 15%) cumprida; nada otimizado além disso.
  Atlas pronto em ~7 s na primeira vez (196 PNGs, swiftshader + rede do sandbox), ~0,5 s ao religar.

### Limites
- Bandeiras são esticadas para a bbox do maior polígono (ex.: Rússia vira faixas largas; Chile e Noruega bem deformados), como na spec 002.
- Só o maior polígono recebe bandeira: Alasca, Chukotka (leste do antimeridiano), Vanua Levu (Fiji), Córsega, Guiana Francesa ficam com pontos.
- w80 esticado em países grandes fica borrado nas bordas internas da bandeira (ok visto de longe; o selecionado usa w640).
- Micro-estados (marcadores) não mostram bandeira.
- Em mock só os ~9 países das fixtures têm bandeira (os demais não são "conhecidos").
