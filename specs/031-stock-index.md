# 031 - Bolsa do país (cotação no site)
Status: done (dono em 2026-11-17: "acho que cotação dentro do site seria melhor ... dale") | Repos: web | Contrato: sem mudança | API: não depende

## Por quê
Pedido B2 do PLAN: mostrar o estado atual do índice principal da bolsa de cada país (Ibovespa, DAX, CAC 40...).

## Dados (lido em 2026-11-17)
- **Yahoo Finance: descartado.** Não tem API oficial; a biblioteca yfinance usa endpoints não documentados e o próprio README diz
  que a API do Yahoo "is intended for personal use only"; os termos do Yahoo, citados por terceiros, proíbem extração automática.
- **Twelve Data / Alpha Vantage: descartados.** Plano grátis da Twelve Data = "internal non-display usage only"; exibição externa
  só com "Redistribution Rights Add-On". Alpha Vantage: licença "personal, non-commercial" salvo acordo escrito.
- **Escolhido: widget gratuito do TradingView** (mini symbol overview, https://www.tradingview.com/widget-docs/). O TradingView
  oferece os widgets "for FREE with default TradingView branding"; os termos exigem atribuição ("The use of any TradingView
  products outside the TradingView website, without a proper attribution of TradingView, is not allowed"). Os dados são
  atrasados ("As per their requirements we are only allowed to stream delayed data") e a B3 é liberada nos widgets com 15 min de
  atraso (blog do TradingView, 2023). O Atlas não copia nem guarda nenhum número: o widget é do TradingView, num iframe dele.

## Cobertura (verificada em 2026-11-17 renderizando cada símbolo no widget)
- **Widget (29)**: BR, FR, CA, CL, NL, BE, PT, SE, NO, DK, FI, GR, IL, EG, MA, IE, HU, CN, HK, IT, ES, RU, DE, IN, CH, ID, PL, AT, CO.
  Com `dateRange: 12M` (alguns índices só liberam fechamento do dia, marca "E"; os outros têm 15 min de atraso, marca "D").
- **Só link (20)**: o widget responde "Permissão negada: este símbolo está disponível somente no TradingView" (licença da bolsa):
  US, JP, GB, KR, AU, MX, AR, TR, SA, TW, SG, TH, MY, PH, VN, NZ, PK, AE, ZA, CZ.
- Sem símbolo válido no widget: PE, NG, KE (seção oculta). Lista em `src/lib/stockIndex.ts`.

## Design
- Bloco "Bolsa" no painel, depois de "Com quem negocia", recolhido por padrão. O script do TradingView só carrega quando o bloco
  é aberto (terceiro com cookies; quem não abre não baixa nada).
- Mostra o nome do índice, o widget (tema escuro, fundo transparente) e o link "Cotação por TradingView" com a explicação das
  marcas D/E. Países "só link": frase curta + link.

## Tarefas
- [x] Pesquisa de fontes e termos
- [x] Lista país -> índice verificada no widget
- [x] Bloco no painel (`src/components/Stock.tsx`), carregamento só ao abrir
- [x] Typecheck, testes, build, prints antes/depois

## Fora desta rodada
- Cotação em tempo real (custa licença das bolsas) e mais países (adicionar símbolo e verificar no widget).
