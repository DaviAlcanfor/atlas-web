# 029 - Do que vive a economia: setores, exportações, parceiros
Status: in progress (aprovada pelo dono em 2026-11-15: "aprovado tudo"; fases 2 e 3 do web feitas sobre mocks) | Contrato: fase 1 = CR-009 (grupo `economy` no perfil; a camada Ranking ganha os 12 indicadores sem CR); fase 2 depende de CR | API: atlas-api/specs/029-economy-structure-trade.md

## Por quê
Mostrar de onde vem a renda de cada país (agro, indústria, serviços, petróleo, alta tecnologia), o que ele exporta e com quem
negocia. Fontes, licenças e fases estão na spec da API.

## Requisitos (QUANDO ... ENTÃO ...)
- QUANDO o painel de um país abre, ENTÃO o bloco "Do que vive a economia" mostra as barras de setor (% do PIB) e de composição das
  exportações, cada uma com ano e fonte; indicador sem dado não aparece.
- QUANDO há frase-resumo ("economia apoiada em petróleo"), ENTÃO ela vem de uma regra explícita sobre os números, e o (i) diz a regra.
- (fase 2) QUANDO a API manda `/trade`, ENTÃO aparecem "O que exporta" (até 10 produtos) e "Com quem negocia" (até 10 parceiros com
  bandeira, clicáveis para abrir o país).
- (fase 3) QUANDO um país está selecionado e a camada de comércio está ligada, ENTÃO arcos saem dele até os principais parceiros.

## Design
- Bloco novo no painel, entre "Em resumo" e "Como vive o povo"; barras no estilo do perfil (`charts.tsx`).
- Página `/economia/[iso2]` ganha as mesmas seções.
- Estados: carregando (esqueleto), vazio (bloco some), erro (mensagem curta, resto do painel segue).

## Tarefas
- [ ] Fase 1: bloco "Do que vive a economia" + verbetes novos no glossário
- [x] Fase 2: zod + mocks no formato do Contract delta; seções de exportação e parceiros (`src/components/Trade.tsx`, mock BR em
  `src/api/mocks/trade.json`)
- [x] Fase 3: arcos no globo (até 10 parceiros: destinos + origens somados por valor; sem animação com `prefers-reduced-motion`)
- [ ] Fase 2/3: conferir os nomes dos campos com o formato final do PR da API e ligar `CountryTrade` ao `contract-check.ts` depois que
  o dono atualizar o contrato
- [ ] `/economia/[iso2]` com as mesmas seções (ficou de fora deste PR)

## Notas da implementação (fase 2/3, web)
- **Os nomes dos campos precisam ser conferidos com o PR da API** (o agente da API pode ter ajustado nomes). Usados no zod
  (`CountryTrade` em `src/api/schemas.ts`): `year`, `exports_usd`, `imports_usd`, `top_exports[{hs, label, value_usd, share}]`,
  `top_destinations[{iso2, value_usd, share}]`, `top_origins[{iso2, value_usd, share}]`, `sources[Source]`. `share` lido como fração
  0-1 (igual ao resto do perfil). Conferido contra o rascunho da CR-010 em `contract/CHANGE_REQUESTS.md` (2026-11-16): mesmos nomes;
  as duas fontes (`baci`, `mdic-sh`) aparecem com licença sob cada seção, e `label` é mostrado sem cortes (CC BY-ND).
- A rota ainda não existe na produção: qualquer falha (404, rota ausente, rede) esconde as duas seções e os arcos, sem banner. O
  navegador ainda registra o 404 no console (não dá para silenciar pelo JavaScript), então `npm run smoke` falha em `/pais/br` até a
  API publicar a rota: fazer o merge depois do PR da API e do contrato.
- Um pedido por país: o painel e os arcos do globo dividem a mesma promessa (`loadTrade`).
- Os arcos aparecem sempre que há país selecionado e dados de comércio (não há camada "comércio" separada, como dizia o requisito).
- Nomes dos parceiros: `Intl.DisplayNames` em pt-BR (sem pedido extra à API).

## Decisões abertas
Ver a spec da API (relações diplomáticas, nomes dos produtos em português, ano dos dados).
