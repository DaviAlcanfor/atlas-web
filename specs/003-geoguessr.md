# 003 — GeoGuessr: Plonk It e pistas do país
Status: done (parte 2 em mocks até a API v1.1 ir ao ar) | Contrato: parte 2 em v1.1 | API: atlas-api/specs/003-geo-clues.md

## Por quê
Ter à mão o "meta" de GeoGuessr de cada país.

## Requisitos
- Parte 1: QUANDO abro um país com guia no Plonk It ENTÃO há um link "Guia Plonk It (GeoGuessr) ↗" que abre
  `https://www.plonkit.net/<slug>` em nova aba. QUANDO não há guia conhecido ENTÃO a seção não aparece.
- Parte 2: bloco "Pistas" com lado de dirigir, DDI, domínio, código de placa, alfabetos (vindos da API). Sem dado = linha omitida.

## Dados
- Só link, nunca copiar conteúdo do Plonk It (obra deles).
- O site é renderizado em JS, por isso fetch simples não lê nada. `scripts/plonkit-slugs.ts` abre cada candidato no Playwright
  e só aceita slug cuja página tenha título "<Nome> — Plonk It" com conteúdo de guia. Resultado: `src/lib/plonkit.ts` (iso2 → slug),
  gerado e commitado. Rodar de novo quando o Plonk It adicionar países.

## Contract delta consumido (parte 2)
`CountryDetail.clues: { driving_side: "left"|"right"|null, calling_code, tld, plate_code: string|null, scripts: string[] } | null`

## Tarefas
- [x] parte 1: `npm run plonkit` (`scripts/plonkit-slugs.ts`) gera `src/lib/plonkit.ts`
- [x] parte 1: seção "GeoGuessr" no `CountryPanel`
- [x] parte 2: zod (`clues` opcional) + mock + bloco "Pistas" dentro da seção GeoGuessr (linhas sem dado omitidas; a seção aparece com só as pistas se não houver guia Plonk It)
