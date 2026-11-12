# 025 - Chatbot do Atlas (todo o conhecimento do app como ferramentas)
Status: draft | Contrato: v1.3 (delta abaixo) | API: atlas-api/specs/025-chatbot.md (a escrever junto)

## Por quê
O dono quer perguntar em linguagem natural ("quais monarquias absolutas existem?", "compare a inflação do Brasil e da Argentina")
e ter respostas que usam os dados do Atlas, com fonte.

## Desenho
- **Backend (atlas-api)**: `POST /v1/chat` com streaming (SSE). O modelo da Anthropic recebe como ferramentas as consultas que a API
  já tem: país, lista/filtro de países, governantes, pessoas, perfil (como vive o povo), economia, moeda/câmbio, idiomas, glossário,
  busca. As ferramentas chamam as funções de `queries.py` direto (sem HTTP). O executor carrega a skill `claude-api` antes de escolher
  modelo e SDK (tool runner do SDK Python).
- **Regras da resposta**: só afirmar o que veio das ferramentas; citar a fonte de cada número; "o Atlas não tem esse dado" quando não tiver;
  responder em pt-BR; links internos (`/pais/br`) viram navegação no globo.
- **Web**: gaveta de chat no lado ESQUERDO (usa o espaço livre que o pedido de 2026-11-12 apontou), botão fixo "Perguntar ao Atlas";
  quando a resposta cita países, o globo voa até eles e os destaca.
- **Custos e abuso**: chave `ANTHROPIC_API_KEY` só no FastAPI Cloud; limite por IP (ex.: 20 perguntas/hora) e teto de tokens por
  resposta; histórico só no navegador.

## Contract delta (proposta, CR a aprovar)
```
POST /v1/chat  body: { messages: [{role: "user"|"assistant", content: str}] (máx. 20) }
-> text/event-stream: event "text" {delta}, event "tool" {name, args}, event "countries" {iso2: [..]}, event "done" {sources: [Source]}
429 problem+json quando passar do limite.
```

## Decisões do dono
- Chave da Anthropic e teto de gasto mensal (o chat custa por pergunta; o resto do Atlas não tem custo variável).
- Modelo: o executor recomenda com base na skill `claude-api` (custo x qualidade).

## Tarefas
- [ ] API: spec espelho, endpoint SSE, ferramentas, limite por IP, testes com modelo simulado
- [ ] Contrato v1.3 (dono) + secret no FastAPI Cloud
- [ ] Web: gaveta à esquerda, streaming, voo do globo para países citados
