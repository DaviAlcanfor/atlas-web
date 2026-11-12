# 021 - Rodada de polimento (feedback de 2026-11-12)
Status: done | Repos: web | Contrato: não muda | Executor: Sonnet

## Itens
1. **Estados visíveis**: as linhas internas (admin-1) somem sobre a bandeira e os pontos. Linha dupla (traço escuro `admin1Line` +
   traço claro fino por cima, 1px cada, levemente deslocado em altitude) para contraste em qualquer fundo. Botão "Estados" no toggle
   (liga/desliga as divisões do país selecionado; ligado por padrão). Hover no estado: o polígono do estado clareia (overlay de pontos
   `iceBright`), além do nome no readout.
2. **Fronteiras de países mais fortes**: subir a opacidade de `border` (0.38 → ~0.6) e `coast`; testar contraste sobre oceano e sobre bandeiras.
3. **Cores do regime distinguíveis**: a rampa de um só matiz não separa 13 categorias. Para a camada de regime (e só ela), usar paleta
   categórica de 8-10 matizes distintos, dessaturados, validada para daltonismo (carregar a skill `dataviz` e usar o validador dela);
   agrupar regimes raros em "outros". Legenda ordenada por número de países, com contagem.
4. **Camada Bandeiras sem borrão**: hoje o atlas usa w80 esticado num quadrado 80x80 (borra e distorce). Usar w160, células com a proporção
   real da bandeira (sem quadrado), atlas até 4096 px de largura (2 texturas se precisar), filtro linear sem mipmap, e reduzir a mistura com os
   pontos para a bandeira ficar tão nítida quanto no país selecionado (spec 002). Medir performance de novo.
5. **Explicação em todo hover + animação**: todo rótulo de informação do painel ganha um ⓘ com tooltip: População, Área, Densidade, Regime,
   Capital, Região, Idiomas, Moedas, Organizações, Política hoje, Governantes, Pessoas, Pistas. Termos com verbete usam o glossário;
   os demais usam textos fixos em `src/lib/explanations.ts` (o que é o dado, de onde vem, como ler). Tooltip com animação de entrada
   (opacity + translateY 4px, 140 ms, `ease-out`; desligada com reduced motion) e leve atraso de abertura (250 ms) para não piscar.
6. **Camada GeoGuessr**: botão no toggle que destaca os países com cobertura oficial do Street View (pontos `ice`) e apaga os demais
   (`iceDim`); 3 níveis se a fonte permitir (cobertura ampla, parcial, só trekker/limitada). Fonte: tabela da Wikipedia "Google Street View
   coverage" (CC BY-SA: atribuir, linkar, data da consulta), gerada por script `scripts/streetview-coverage.ts` em `src/lib/streetview.ts`
   (mesmo padrão do Plonk It). Legenda com fonte e data.
7. **Tela de carregamento**: barra de progresso com porcentagem real, por etapas ponderadas (geometria `modern.geojson` + `lines.json` por
   bytes recebidos via `ReadableStream`, lista de países da API, textura do globo, primeira renderização). No centro, a matriz de pontos
   do mundo se acendendo conforme o progresso (canvas 2D leve, não WebGL). No canto inferior esquerdo, mensagens que trocam a cada ~2,5 s
   (ex.: "Carregando 196 países", "Desenhando 240 mil pontos", "Buscando bandeiras", "Primeira visita é mais lenta: a API acorda do
   modo econômico") e uma curiosidade aleatória curta tirada dos dados. Reduced motion: sem animação, só a barra.
8. **Painel**: fundo menos transparente (`panel` alfa 0.88 → 0.96, blur mantido); remover o botão de expandir e o modo largo; largura
   fixa maior (460 → 540 px desktop; mobile continua folha inferior).

## Tarefas
- [x] 1 estados + botão + hover do estado. Linha dupla: escura `admin1Line` + clara `admin1Light` deslocada 0,1° (~1 px) e 0,0002 de altitude; botão "Estados" (grupo próprio, só com país selecionado, ligado por padrão); hover = overlay transparente de pontos `iceBright` (+ tinta 0,3) no polígono do estado e contorno `iceBright`. Perf: ver 4.
- [x] 2 fronteiras: `border` 0,38 -> 0,62 e `coast` 0,55 -> 0,78 (cor um tom mais clara); legível sobre oceano, pontos e bandeiras (screenshots 04, 10).
- [x] 3 paleta categórica do regime: 8 matizes (azul `#3987e5`, laranja `#d95926`, água `#199e70`, âmbar `#c98500`, magenta `#d55181`, verde `#008300`, violeta `#9085e9`, vermelho `#e66767`), os do modo escuro da skill `dataviz` (validador, superfície `#0a1f2b`: banda de luminosidade, croma, CVD adjacente ΔE 8,4, visão normal ΔE 19,3, contraste >= 3:1: tudo PASS). Com 8 matizes o `--pairs all` de mapa não passa: a legenda (cor + nome + contagem) e o hover são a codificação secundária. Regimes com menos de 2 países viram "Outros" (cinza `regimeOther`, fora da validação); legenda por nº de países.
- [x] 4 atlas de bandeiras nítido + perf: w160 na proporção real, empacotamento em prateleiras, 4096 px de largura (1 textura), linear sem mipmap, mistura da camada 0,6 -> 0,74. Perf (swiftshader, 1061x773, arrasto de 120 passos): Padrão 150 ms mediana / p95 167 ms (antes dos itens 1, 2 e 4: 183 / 250 em dev); camada Bandeiras vs Padrão: nova 1,11x, antiga (w80) 1,08x na mesma sessão (ruído de ±20% entre sessões).
- [x] 5 ⓘ em todos os rótulos + animação do tooltip: `Hint` (ⓘ após o rótulo; verbete do glossário se existir, senão `src/lib/explanations.ts`), em Stat, Capital, Região, seções do painel e Pistas. Tooltip: abre após 250 ms, opacity + translateY 4 px em 140 ms `ease-out` só sem reduced motion; o portal só monta no cliente (o painel é renderizado no servidor).
- [x] 6 camada GeoGuessr: `npm run streetview` (`scripts/streetview-coverage.ts` + parser testado `scripts/streetview-parse.ts`) lê a tabela "Current coverage" da Wikipedia via API do MediaWiki (revisão 1385161559, consultada em 2026-11-12, CC BY-SA 4.0) e escreve `src/lib/streetview.ts`. Níveis pelo markup da página: negrito + asterisco = público (117 países), negrito sem asterisco = restrito (15), texto simples = só locais/empresas (0 hoje). Nomes: Natural Earth + `i18n-iso-countries` + aliases; sem nomes sem mapeamento; 8 linhas sem polígono no `modern.geojson` (Akrotiri e Dhekelia, Ilha Christmas, Cocos, Gibraltar, Martinica, Reunião, Svalbard, Ilhas Menores dos EUA). Legenda com fonte, licença e data.
- [x] 7 tela de carregamento com progresso: `LoadingScreen` com pesos geometria 40% (bytes via `ReadableStream`, tamanhos aproximados), lista da API 15%, código do globo 15%, primeira renderização 30% (sem sinal real: avança devagar até 85% da fatia). Matriz de pontos 2D (máscara de terra de 2,5° gerada por `npm run landmask`, 3,4 kB), mensagens a cada 2,5 s e curiosidade tirada da lista da API. O valor é escrito direto no DOM: re-renderizar a 60 fps impedia o globo de montar. Reduced motion: só barra e primeira mensagem.
- [x] 8 painel: alfa 0,96, blur mantido, sem botão/modo largo, 540 px (folha inferior no mobile). Camadas em 400 px: botões menores para caberem.
