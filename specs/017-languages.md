# 017 - Idiomas: oficiais e os outros falados
Status: approved | Contrato: v1.2 | API: atlas-api/specs/017-languages.md | Executor: Sonnet

## Por quê
Hoje só aparece o idioma oficial. Quero ver também os indígenas, de imigração, regionais e de sinais (no Brasil: Nheengatu, Tupi,
Guarani, Libras, Hunsrik/alemão, Talian, Pomerano...), sempre diferenciando o status.

## Requisitos
- Seção Idiomas em grupos, cada um com estilo de chip próprio:
  - **Oficial** (nacional): chip preenchido em `ice`.
  - **Cooficial regional/municipal** (ex.: Nheengatu em São Gabriel da Cachoeira): chip com borda `ice` + sufixo do lugar no hover.
  - **Indígena**: chip com borda tracejada.
  - **Imigração / comunidade**: chip com borda pontilhada.
  - **Língua de sinais**: chip com ícone de mão (Phosphor `HandWaving`).
  - **Histórica / extinta** (ex.: Tupi antigo): chip esmaecido, com o ano/século de extinção no hover.
- Legenda curta acima dos chips. Hover em qualquer chip: família linguística, falantes (com ano e fonte), status de ameaça (UNESCO/Ethnologue
  se disponível em fonte aberta), onde é falada.
- Até 12 chips visíveis, o resto atrás de "ver todos (N)".

## Contract delta consumido (v1.2)
```
CountryDetail.languages_spoken: [{ code: string|null, name, status: "official"|"co_official"|"indigenous"|"immigrant"|"sign"|"historical",
  where: string|null, speakers: { value: int, year: int|null }|null, family: string|null, endangerment: string|null,
  wikipedia_url: string|null }]
```
`languages` (v1.0) continua igual (só oficiais), para não quebrar clientes.

## Tarefas
- [ ] zod + mocks (Brasil com os exemplos acima); chips por status + legenda + hover; "ver todos"
