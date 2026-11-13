# 004 — Glossário: tooltips, popups e ícones
Status: done (no ar) (revisado em 2026-11-13) | Contrato: v1.1 | API: atlas-api/specs/004-glossary.md

## Por quê
O painel diz *o que* é o regime, não *como funciona*. Quero tooltip curto no hover, explicação completa no clique,
um catálogo de todos os termos e ícone para cada tipo de informação.

## Requisitos
- QUANDO passo o mouse ou foco num termo com ⓘ (regime, região, organização, moeda) ENTÃO aparece tooltip de 1-2 frases (`short`).
- QUANDO clico ENTÃO abre popup com o texto completo (`body`), países de exemplo (`examples`, clicáveis: voam até o país) e fontes.
- QUANDO o termo não tem verbete ENTÃO só texto, sem ⓘ.
- Página `#/glossary` com todos os verbetes agrupados por `kind`, com busca local.
- Ícone em cada bloco do painel: regime, moeda, região, idiomas, população, área, capital, organizações.

## Contract delta consumido
```
GlossaryTerm { id, kind: "regime"|"system"|"region"|"membership"|"currency"|"other", label, short, body,
               icon: string|null, examples: string[], sources: Source[] }
CountrySummary/CountryDetail += regime_id: string|null
GET /v1/glossary -> { items: GlossaryTerm[] }       (carregar uma vez, junto com /v1/countries)
```
Região e organização não têm id no contrato: casar pelo texto (`label` === valor exibido); sem match = sem ⓘ.

## Design
- `Tooltip`: componente pequeno, `aria-describedby`, abre em hover/foco, fecha com Esc; posicionado acima, vira abaixo se não couber.
- Popup: `<dialog>` nativo com `showModal()` (foco preso, Esc e backdrop de graça). Sem lib de modal.
- `body`: parágrafos separados por `\n\n`, renderizados como `<p>` (texto puro, nunca HTML).
- Ícones: SVGs inline em `src/components/icons.tsx` (8 ícones, traço 1.5, `currentColor`, `aria-hidden`).
  Decisão aberta: `lucide-react` evitaria desenhar os ícones, mas é dependência nova para 8 SVGs.

## Tarefas
- [x] ícones nos blocos do painel: SVG inline em `src/components/icons.tsx` (rótulo do bloco → ícone), sem dependência nova
- [x] zod + mock do glossário (`GlossaryTerm` em `src/api/schemas.ts`; mock com os 21 verbetes reais em `src/api/mocks/v11.json`); `api.glossary()` carregado uma vez junto com `/v1/countries`, falha = sem ⓘ (sem banner)
- [x] `Tooltip` (`src/components/Tooltip.tsx`: hover + foco, `aria-describedby`, Esc, vira abaixo se não couber, portal em `<body>`), `Term` (ⓘ + clique), `GlossaryDialog` e `GlossaryPage` (`src/glossary.tsx`); ligado em Regime (por `regime_id`), Região e Organizações (por rótulo)
- [x] rota `#/glossario` (nome em pt-BR; não `#/glossary`), link "Glossário" sob o toggle de camada; só aparece se o glossário carregou
- [x] clique num exemplo seleciona o país e a câmera voa (o voo agora acompanha `selectedId`, também por hash)

## Decisões abertas
1. Ícones: SVG inline (recomendado, zero dependência) ou `lucide-react`?
