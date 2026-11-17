# 036 - Chat (consultas e conversas) e URL da viagem no tempo
Status: approved | Repos: web | Contrato: sem mudança (v1.10 já traz `{name, args}` no evento `tool`) | API: não depende

Aprovado pelo dono em 2026-11-17: "pode continuar, faz o que dá pra fazer agora" (itens da "Lista do dono de 2026-11-17 (triagem)" do `PLAN.md`).
Uma PR por parte, todas contra `main`.

## A. Consultas do chat (estilo log de atividade do Claude/Codex)
- Em cada turno do assistente, uma lista recolhível "Consultas (N)" com uma linha por tool: nome amigável em pt-BR
  (`get_economy` -> "Economia", `get_trade` -> "Comércio", `indicator_ranking` -> "Ranking de indicador"...) + argumentos como chips `chave: valor`.
  Códigos de país (ISO 3166-1 alfa-2) viram bandeira + nome em pt-BR (`Intl.DisplayNames`).
- Ao vivo durante a resposta (aberta, spinner na consulta atual); recolhida por padrão quando a resposta termina.
- Guardada com o turno no `sessionStorage` (depois, no histórico da parte B). Estilo compacto, mono, apagado.
- [ ] `src/lib/chatTools.ts` (nomes, chips) + testes; [ ] `ChatDrawer` guarda `tools` no turno; [ ] CSS.

## B. Conversas
- Várias conversas no `localStorage` (try/catch; no máximo 20, a mais antiga cai), cada uma com título automático (1ª pergunta, 60 caracteres) e data.
- Lista "Conversas" dentro da gaveta: trocar, nova, apagar uma. O histórico único de `sessionStorage` migra para a 1ª conversa.
- Sem armazenamento no servidor (não há login ainda).
- [ ] `src/lib/chatSessions.ts` + testes (migração, limite, troca); [ ] UI.

## C. URL e nome na viagem no tempo
- Com a viagem no tempo ligada e um Estado histórico selecionado, a URL leva `?ano=1700&entidade=<slug de name_en>`; é lida ao abrir.
- `document.title` = "<Estado> em <ano> · Atlas" (sem seleção: "Viagem no tempo, <ano> · Atlas"); ao sair volta o título anterior.
- Leitor e painel nunca mostram o país moderno durante a viagem (ex.: sair de `/pais/ve` para o Império Otomano não diz Venezuela).
- [ ] helpers em `src/lib/timeTravel.ts` + testes; [ ] `Shell.tsx`.
