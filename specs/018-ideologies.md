# 018 - Ideias e ideologias: pensadores e figuras de cada lado
Status: approved | Contrato: v1.2 | API: atlas-api/specs/018-ideologies.md | Executor: Sonnet (UI), Opus (curadoria na API)

## Por quê
Entender, em cada país, conceitos como capitalismo, comunismo, socialismo, liberalismo, conservadorismo, social-democracia,
anarquismo, fascismo, nacionalismo: quem foram os pensadores e as figuras importantes de cada corrente ali, o que fizeram e a história deles.

## Requisitos
- Seção "Ideias políticas" no painel: as correntes com presença no país (ordenadas por número de figuras), cada uma com:
  definição curta (verbete da spec 004, `kind: "ideology"`), 3-6 figuras (foto com crédito, anos, papel: pensador, líder, ativista),
  partidos ligados, e 1-2 marcos históricos no país.
- Clique numa figura: cartão com biografia curta (2-3 frases), o que fez, obras principais, link Wikipedia.
- Página `#/ideias/<id>`: a corrente no mundo: verbete completo, linha do tempo global, pensadores fundadores, países onde foi governo.
- **Neutralidade obrigatória**: todas as correntes com o mesmo tratamento visual e de texto; sem adjetivos de valor; apresentar
  críticas e defesas com fonte quando o verbete tratar de controvérsia; regimes autoritários de qualquer lado descritos com os fatos
  (ex.: repressão, mortes) com fonte. Esta regra vale para o texto da API e para a UI.

## Contract delta consumido (v1.2)
```
GlossaryTerm.kind += "ideology"
IdeologyFigure { person_id, name, role: "thinker"|"leader"|"activist"|"other", birth_year, death_year, summary, works: string[],
                 image: Image|null, wikipedia_url }
GET /v1/countries/{iso2}/ideologies -> { items: [{ term: GlossaryTerm, figures: IdeologyFigure[], parties: [{ id, name }],
                                                   milestones: Event[] }], sources: Source[] }
GET /v1/ideologies/{id}             -> { term: GlossaryTerm, founders: IdeologyFigure[], timeline: Event[],
                                         governed: [{ iso2, from_year, to_year }], sources: Source[] }
```

## Tarefas
- [ ] zod + mocks; seção Ideias políticas; cartão de figura; página `#/ideias/<id>`
