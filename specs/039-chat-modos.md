# 039 — Chat: modos de resposta e "mostrar no mapa"
Status: approved (dono, 2026-11-18; nomes em português; Narrar na segunda entrega) | Contrato: v1.10 (precisa de CR para `mode` e para o evento `map`) | API: atlas-api/specs/039-chat-modes.md (a escrever)

## Por quê
Há muito para explorar e a pessoa não sabe por onde começar. O chat deve **guiar a exploração**, não só responder. Um agente só, com
modos (decisão do PLAN: multiagentes só depois). O que o chat já faz (spec 025): responde com dados e fontes do Atlas, mostra as
consultas das tools, foca o globo nos países citados.

## Requisitos
- QUANDO a pessoa escolhe um modo (seletor no chat ou `/learn`, `/analyse`, `/tell`) ENTÃO o servidor troca o bloco de instruções do
  prompt de sistema; as tools e o escopo (só geopolítica e dados do Atlas) não mudam.
  - **Aprender**: etapas curtas ligadas aos dados; termina com 2-3 opções ("simplifica", "continua", "me testa").
  - **Analisar**: compara países/indicadores com valor, ano, fonte, método e lacunas; diz os limites da comparação.
  - **Narrar**: história em etapas; **só com conteúdo que o Atlas tem** (períodos e fronteiras da viagem no tempo, fatos com fonte).
    Rotas militares e batalhas exigem dado próprio e ficam FORA até haver fonte (ex.: Aníbal: rota ambígua, só com incerteza explícita).
- QUANDO a pessoa abre o chat com uma tela aberta (país, camada, indicador, período) ENTÃO aparece "O que posso explorar daqui?" com
  3 perguntas geradas do contexto (sem chamada ao modelo: lista fixa por tipo de tela).
- QUANDO a resposta cita um país, camada ou período ENTÃO botão "mostrar no mapa" (foco já existe; camada e período são novos,
  evento SSE `map` com `{iso2[], layer?, year?}`, validado no cliente: nada fora dos valores conhecidos).
- Sem modo escolhido = comportamento de hoje.

## Contract delta consumido (CR a criar pelo agente da API, aprovada pelo dono)
- `POST /v1/chat`: campo opcional `mode: "learn" | "analyse" | "tell"`.
- SSE: evento novo `map` (`iso2: string[]`, `layer?: string`, `year?: int`).

## Design
Seletor de modo no cabeçalho do chat (3 chips); chips de sugestão acima do campo quando a conversa está vazia; botão "mostrar no
mapa" na bolha. Estados: sem sugestão = chips ocultos; `map` inválido = ignorado (sem erro na tela).

## Tarefas
- [ ] API: spec 039, CR, `mode` no request, 3 blocos de prompt, evento `map`, testes (modo desconhecido = 422; injeção não troca modo)
- [ ] Web: seletor de modo, comandos `/learn` `/analyse` `/tell`, chips "O que posso explorar daqui?", botão "mostrar no mapa"
- [ ] Prints antes/depois no PR

## Decisões abertas (do dono)
- Nomes dos modos em português na tela (Aprender / Analisar / Narrar)?
- Narrar entra já na primeira entrega (com histórias curadas) ou só Aprender + Analisar + "mostrar no mapa"? Recomendação: segunda.
- Teto de uso por modo ou por conta fica para a spec de login.
