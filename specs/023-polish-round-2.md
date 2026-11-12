# 023 - Rodada de polimento 2 (feedback de 2026-11-12, noite)
Status: done | Repos: web | Contrato: não muda | Executor: Opus (sessão principal)

## Pedidos e o que foi feito
| Pedido | Feito |
|---|---|
| Borda dos estados grossa demais | Linha dupla da 021 trocada por um traço claro único, translúcido (`admin1Line` = iceBright a 0,42). |
| Estados com relevo demais | País selecionado sobe menos (`ALT_SELECTED` 0,015 -> 0,008); pontos do estado em hover menores (0,4 -> 0,34). |
| Estados opcionais | Botão "Estados" começa desligado: sem ele, só a bandeira no território; ligado, as divisões aparecem e ficam clicáveis/hover. |
| Bandeira não aparece no globo (Mauritânia, Guiné-Bissau, Mali...) | Causa principal: a API em produção estava com 503 em `/v1/countries*` (migração 0007-0010 não rodada depois do merge do PR #5 da API), e a bandeira do país selecionado e a camada Bandeiras dependiam da API. Agora as duas vêm direto do flagcdn pelo ISO2 (`flagLargeUrl`, `flagAtlasUrl`), sem esperar a API. A migração é feita pelo dono com `fix-prod-0010.ps1`. |
| Ícone do site | `app/icon.svg` (globo de pontos com o ponto vermelho "signal"); o Next gera o `<link rel="icon">`. |
| Governantes poluem a tela | Atuais + os 3 anteriores mais recentes; o resto em "ver todos os anteriores (+N)". |
| Mais informação de GeoGuessr | Pistas ganham "Street View" (cobertura pública/restrita/sem, da tabela da Wikipedia da 021) e "Hemisfério" (posição do sol ao meio-dia, calculada pela latitude do país). Pistas mais ricas (postes, placas, câmeras) precisam de fonte com licença: backlog B15. |
| Aba de informações mais larga | Painel `clamp(460px, 46vw, 640px)` (antes 540 px). |
| Usar mais o lado esquerdo | Com o painel aberto, o globo recentra no espaço livre à esquerda (`.globe-slot--panel`), em vez de ficar metade escondido atrás do painel. |
| Glossário monótono, sem índice | Página por temas (Repúblicas, Monarquias, Partido único/militares/religião, Sistemas, Regiões, Organizações, Moedas, Outros), cada tema com cor da paleta categórica validada + ícone + descrição; índice lateral fixo com contagem (vira chips no celular); termos em cartões A-Z. |
| Readout do topo em inglês ("Brazil") | Usa o nome pt-BR da API, com o do Natural Earth como reserva. |

## Fora desta spec (viraram specs/itens próprios)
- Bandeira e dados de cada estado: [024](024-subdivisions-data.md).
- Chatbot com todo o conhecimento do app: [025](025-chatbot.md).
- Resumo corrido da história do país: já é a 016 ampliada (PLAN, P4.5).

## Tarefas
- [x] linhas de estado finas + menos relevo
- [x] estados desligados por padrão
- [x] bandeiras pelo ISO2 (selecionado + camada)
- [x] favicon
- [x] governantes recolhidos
- [x] pistas: Street View + hemisfério
- [x] painel mais largo + globo recentrado à esquerda
- [x] glossário por temas com índice
- [x] readout em pt-BR
- [x] testes (vitest 49/49), typecheck, screenshots BR/ML/glossário
