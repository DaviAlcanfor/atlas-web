# 014 - Todos os países com cara de clicáveis + camada de bandeiras
Status: parte 1 done, parte 2 approved | Repos: web | Contrato: não muda | Executor: Sonnet (parte 1), Opus (parte 2)

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
- [ ] parte 2: atlas de bandeiras + material da camada; medir performance; screenshots
