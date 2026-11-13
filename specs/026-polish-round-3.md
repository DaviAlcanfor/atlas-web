# 026 - Rodada de polimento 3 (feedback de 2026-11-13)
Status: done (verificado local; produção depende do deploy e da importação de dados) (aprovada pelo dono em 2026-11-13: "oq precisar de aprovação eu aprovo tudo") | Repos: web + API |
Contrato: v1.3 (CR-004 addendum 4: `Subdivision.area_codes`) | API: atlas-api/specs/026-orgs-area-codes-history.md

## Pedidos e o que fazer
| Pedido | Onde | O que fazer |
|---|---|---|
| Bandeira do país pisca por cima das bandeiras dos estados | web | Causa: z-fighting. A tampa dos estados ficava 0,0002 acima da tampa do país, mas os triângulos grandes da tampa do país afundam mais que isso entre os vértices; as duas superfícies se cruzam e trocam de lugar a cada quadro. Estados sobem para `ALT_SELECTED + 0,0015`; linhas e contorno acompanham. |
| Mostrar todos os estados ou só o selecionado | web | Com "Estados" ligado, um segundo controle: "Bandeiras: todas / só a selecionada". |
| "Como vive o povo": grupos fechados | web | Todos os `<details>` começam fechados. |
| Pessoas importantes: menos gente | web | 5 visíveis, "ver mais (+N)" mostra o resto do filtro. |
| Resumo da história do Brasil ainda fraco | API | ETL `wikipedia-history`: cada período passa a incluir o 1º trecho de cada subseção ("Primeiro Reinado (1822–1831): ..."), não só o 1º parágrafo; "História do X começa" vira "A história do X começa". Continua mecânico (sem IA; resumo por IA = spec 022). |
| História retrátil | web | "Marcos" fica recolhido atrás de "ver os N marcos"; os períodos já são `<details>`. |
| Economia acessível sem clicar na moeda | web | Link "Economia" no canto esquerdo (junto de "Glossário") abre `/economia`: página global com busca e todos os países com bandeira, por região, mais as moedas principais. Cada país leva à análise econômica dele (`/moeda/<código>?pais=XX`, que escolhe o país em "Economia do país"). |
| Página de economia monótona | web | Seções numeradas em cartões com cor e ícone próprios e índice no topo; indicadores agrupados (Atividade, Preços, Comércio e contas, Pessoas). |
| Comparar países: bandeiras | web | Bandeira nas fichas e em cada célula. |
| Organizações: só ONU | API | `content/organizations.yaml` curado (Mercosul, BRICS, G7, G20, UE, OTAN, OPEP, ASEAN, União Africana, CPLP, OCDE), com fonte e data; verbetes no glossário. |
| ONU no glossário: só nomes, sem dizer que há mais | web | Exemplos com bandeira e o aviso "alguns dos países (lista não completa)". |
| DDD dos estados | API + web | `Subdivision.area_codes`. Brasil: tabela da Anatel (curada). Outros: Wikidata P473 onde existir (cobertura baixa: medido 2026-11-13, BR 1/27, US 6/51, JP 0/47, IT 95/110). Mostrado no cartão do estado. |
| Cédulas e moedas | — | Fora desta spec: a licença das imagens muda por país (ex.: as cédulas do euro têm direitos do BCE). Vira o item B16 do backlog, com pesquisa de licença antes de qualquer código. |

## Tarefas
- [x] z-fighting dos estados
- [x] modo "todas / só a selecionada"
- [x] perfil fechado; pessoas 5 + ver mais; marcos recolhidos
- [x] `/economia` + link no canto esquerdo + `?pais=`
- [x] página da moeda em seções com índice; bandeiras no comparar
- [x] exemplos do glossário com bandeira e aviso
- [x] DDD no cartão do estado (zod opcional)
- [x] typecheck, testes, build, screenshots
