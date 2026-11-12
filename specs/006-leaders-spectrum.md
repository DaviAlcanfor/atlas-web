# 006 — Governantes e espectro político
Status: draft | Contrato: v1.1 (governantes), v1.2 (espectro) | API: atlas-api/specs/006-leaders-spectrum.md

## Requisitos
- Aba/seção "Governantes": chefe de Estado e chefe de governo (uma lista só quando é a mesma pessoa), mais recente primeiro,
  com foto (com crédito), nome, partido, início–fim, link Wikipedia. Paginação simples ("mostrar mais") depois de 10.
- Barra esquerda ↔ direita quando `position` existir: marcador, ano da medição, fonte e o texto fixo
  "escala da fonte, não opinião do Atlas". Sem `position` = sem barra. Coalizão: um marcador por partido do gabinete.
- O governo atual aparece no bloco "Política hoje" do painel, com a barra.

## Contract delta consumido
```
Leader { person_id, name, role: "head_of_state"|"head_of_government", office, start: string|null, end: string|null,
         party: { id, name }|null, image: { url, credit, license }|null, wikipedia_url: string|null,
         position: { scale, value /* -1..1 */, raw, raw_scale, year, source_id }|null /* v1.2 */ }
GET /v1/countries/{iso2}/leaders?role= -> { items: Leader[] }
```

## Design
- `LeadersList` e `SpectrumBar` (SVG simples, sem lib). Cores da barra neutras (não usar vermelho/azul partidário).
- Foto: `loading="lazy"`, crédito em `<figcaption>`; `image` null = iniciais.

## Tarefas
- [ ] zod + mock; `LeadersList`; governo atual em "Política hoje"
- [ ] `SpectrumBar` (após v1.2)
