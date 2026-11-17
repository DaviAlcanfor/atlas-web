# 037 - Carregamento, acessibilidade dos títulos e medição de cache
Status: approved | Repos: web | Contrato: sem mudança | API: não depende

Aprovado pelo dono em 2026-11-17: "pode continuar, faz o que dá pra fazer agora" (itens da "Lista do dono de 2026-11-17 (triagem)" do `PLAN.md`).
Uma PR por parte, todas contra `main`.

## A. Tela de carregamento (PR web#47)
- Barra de progresso suave com as etapas reais do `Shell.tsx` (mapas, lista da API, glossário, globo), etapa atual destacada.
- Curiosidades em pt-BR numa lista constante (`src/lib/facts.ts`, só fatos verdadeiros e estáveis, sem números inventados, fonte anotada no arquivo),
  visíveis desde o primeiro quadro; as calculadas a partir da lista da API entram depois. `prefers-reduced-motion`: sem animação e sem rotação.
- Mantido "Entrar sem o globo" (após 20 s ou falha).
- [x] `facts.ts` + teste; [x] `LoadingScreen` + CSS; [x] prints antes/depois (desktop e iPhone 13).

## B. Auditoria de títulos e contraste do painel do país (PR web#48)
- Hierarquia: o painel começava em h2 e a página não tinha h1. Corrigido com um h1 só para leitores de tela; ordem h1, h2, h3, h4 sem pular nível.
- Contraste com os tokens (razão WCAG sobre `panelSolid` #07111b / `landFill` #0a1f2b): text 15,8 / 14,1; textDim 7,3 / 6,5;
  textFaint 3,7 / 3,3 (falhava 4,5:1 em ~500 trechos de texto de 10 a 12 px) -> corrigido para #738b95: 5,3 / 4,7; ice 12,1 / 10,8; signal 6,2 / 5,5.
- [x] h1 + `.sr-only`; [x] `textFaint`; [x] testes (níveis de título, contraste mínimo 4,5:1 dos tokens de texto).

## C. Cache: só medição (esta PR; nada implementado)
Método: Playwright (Chromium headless, CDP `Network.*`), `/pais/br` em produção, 3 visitas no mesmo contexto (cache HTTP do navegador ligado):
1ª visita (frio), 2ª e 3ª (recarga e nova navegação). Bytes = `encodedDataLength` (comprimido, como trafega). Em 2026-11-17.
Observação: `atlas-web-ruddy.vercel.app` responde 307 para `explore-atlas.vercel.app` (o domínio real do front hoje).

| Medida | 1ª visita (frio) | 2ª visita (cache do navegador) |
|---|---|---|
| Requisições totais | 54 | 54 (todas servidas do cache local) |
| Bytes transferidos | 2,14 MB | ~0 MB |
| Requisições à API | 13 | 13, todas do cache (0 bytes, 0 idas à rede) |
| Bytes da API | 55 KB | 0 |

- Maior parte dos bytes é estática e já imutável: chunk do three.js (505 KB), `modern.geojson` (417 KB), `lines.json` (365 KB), fotos da Wikimedia (até 72 KB cada).
  A API pesa pouco (55 KB nas 13 chamadas; o maior é `/v1/glossary`, 14,6 KB; `/v1/countries` 9 KB e é pedido 2 vezes na mesma visita, a 2ª sem corpo).
- A API já manda `Cache-Control: public, max-age=300, stale-while-revalidate=86400` e ETag fraco em todas as 13. Revalidação medida com `curl`:
  `If-None-Match` devolve `304` com 0 byte de corpo (`/v1/glossary`: 54 KB sem compressão contra 0).
- `/data/*.geojson` e `lines.json` saem da Vercel com `Cache-Control: public, max-age=0, must-revalidate` (padrão para `public/`): cada visita revalida (304, sem corpo), mas custa uma ida à rede por arquivo.
- Ressalva da medição: o cache só vale enquanto o contexto do navegador for o mesmo; a 1ª visita de cada pessoa continua fria (2,1 MB).

### Recomendação (não implementada)
1. **Nada de camada nova de cache de dados agora.** O cache HTTP + ETag + stale-while-revalidate da API já zera os bytes na revisita; um cache em JS (SWR, React Query) só adicionaria invalidação própria.
2. **Geometria estática (`public/data/*`)**: mudar para `max-age=31536000, immutable` com nome versionado (hash no nome, ou `?v=<build>` na URL) em `next.config.ts` `headers()`. Ganho: elimina ~4 idas de revalidação por visita; invalidação: o hash muda a cada `npm run data`.
3. **Fotos da Wikimedia**: fora do nosso controle (cache da própria Wikimedia); se pesarem, usar `next/image` com tamanho fixo (miniatura `330px` já é usada).
4. **API**: se a 1ª visita lenta (modo econômico) incomodar, o ganho está no servidor (manter instância quente ou CDN na frente), não no front. Invalidação já resolvida: `max-age=300` limita a defasagem a 5 min e o ETag muda quando a ETL muda o dado.
5. Re-medir depois de qualquer mudança de cabeçalho com o mesmo script (Playwright + CDP) antes de declarar ganho.
- [x] medição; [x] recomendação; [ ] implementação (fora desta rodada, depende do dono).
