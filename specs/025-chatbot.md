# 025 - Chatbot do Atlas (todo o conhecimento do app como ferramentas)
Status: in progress (API e web prontas; falta o secret no FastAPI Cloud) | aprovada (dono em 2026-11-17: "a chave do chatbot é a mesma que já tá no projeto, do AI Gateway ... só deixo usar o gpt 6 luna ... dale") | Contrato: CR-012 (delta abaixo) | API: atlas-api/specs/025-chatbot.md (a escrever junto)

## Por quê
O dono quer perguntar em linguagem natural ("quais monarquias absolutas existem?", "compare a inflação do Brasil e da Argentina")
e ter respostas que usam os dados do Atlas, com fonte.

## Desenho
- **Backend (atlas-api)**: `POST /v1/chat` com streaming (SSE). Modelo **`openai/gpt-6-luna` e nenhum outro** (decisão do dono;
  trocar de modelo exige aprovação dele), pelo Vercel AI Gateway (endpoint compatível com OpenAI
  `https://ai-gateway.vercel.sh/v1/chat/completions`, chave `AI_GATEWAY_API_KEY`, a mesma do ETL de `etl/ai/summaries.py`), com
  chamada de ferramentas (tool calling). Ferramentas = as consultas que a API já tem: país, lista/filtro de países, governantes,
  pessoas, perfil, economia, comércio, moeda/câmbio, idiomas, glossário, busca, ranking de indicadores. Chamam as funções de
  `queries.py` direto (sem HTTP).
- **Regras da resposta**: só afirmar o que veio das ferramentas; citar a fonte de cada número; "o Atlas não tem esse dado" quando não tiver;
  responder em pt-BR; links internos (`/pais/br`) viram navegação no globo.
- **Web**: gaveta de chat no lado ESQUERDO (usa o espaço livre que o pedido de 2026-11-12 apontou), botão fixo "Perguntar ao Atlas";
  quando a resposta cita países, o globo voa até eles e os destaca.
- **Custos e abuso** (padrões do agente; o dono não fixou teto, todos ajustáveis por variável de ambiente): `AI_GATEWAY_API_KEY`
  só no servidor (FastAPI Cloud); 20 perguntas por hora por IP; 300 perguntas por dia no total (depois disso, 429 com mensagem
  "o chat atingiu o limite de hoje"); no máximo 6 rodadas de ferramentas e 1.200 tokens de saída por resposta; histórico só no
  navegador; o servidor não guarda as conversas.

## Contract delta (proposta, CR a aprovar)
```
POST /v1/chat  body: { messages: [{role: "user"|"assistant", content: str}] (máx. 20) }
-> text/event-stream: event "text" {delta}, event "tool" {name, args}, event "countries" {iso2: [..]}, event "done" {sources: [Source]}
429 problem+json quando passar do limite.
```

## Decisões do dono (2026-11-17)
- Chave: a do AI Gateway que já está no projeto (`AI_GATEWAY_API_KEY`).
- Modelo: só `openai/gpt-6-luna`. Qualquer outro precisa de aprovação.
- Teto de gasto: não informado; valem os limites acima até o dono mudar.

## Tarefas
- [x] API: spec espelho, endpoint SSE, ferramentas, limite por IP, testes com modelo simulado (atlas-api PR #27)
- [x] Contrato v1.10 (CR-012)
- [ ] Secret `AI_GATEWAY_API_KEY` no FastAPI Cloud (dono)
- [x] Web: gaveta à esquerda, streaming, voo do globo para países citados

## Entregue (web)
- Botão "Perguntar ao Atlas" abaixo do leitor (no celular: ícone na barra do topo, ao lado da busca). `<dialog>` nativo com
  `showModal()`: foco preso, Esc fecha, clique fora fecha; no celular vira folha de tela cheia.
- `src/api/chat.ts`: `POST /v1/chat` com fetch + ReadableStream e parser SSE próprio (sem dependência); eventos validados com zod.
  Modo mock: `src/api/mocks/chat.ts` (resposta de exemplo, mesma ordem de eventos).
- `src/components/Markdown.tsx`: parágrafos, negrito, listas, links, sem `dangerouslySetInnerHTML`; `/pais/xx` navega pelo router
  (no celular a folha fecha para mostrar o globo), links externos em nova aba.
- `countries`: o globo voa até o primeiro país e o destaca (sem mudar a seleção). "consultando …" pelos eventos `tool`;
  rótulo "Gerado por IA (gpt-6-luna) com dados do Atlas" + `done.sources`. 429/503/erro mostrados na gaveta.
- Histórico no `sessionStorage` (aba atual) + "Nova conversa"; manda as últimas 20 mensagens.
