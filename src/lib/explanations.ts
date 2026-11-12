// Spec 021 item 5: what each panel label means, where the data comes from and how to read it. Used for labels that have no
// glossary entry (labels with one use the glossary's short text instead, see Hint). Fixed text, never fetched.
export const EXPLANATIONS: Readonly<Record<string, string>> = {
  'População': 'Número de habitantes do país. O ano e a fonte aparecem logo abaixo do número; estimativas mudam a cada ano.',
  'Área': 'Superfície total do território em quilômetros quadrados (terra e águas interiores). Vem da API do Atlas; a fonte está em Fontes, no fim do painel.',
  'Densidade': 'Habitantes por quilômetro quadrado. Calculada aqui: população dividida pela área. Países com grandes áreas vazias parecem menos densos do que as cidades são.',
  'Regime': 'Como o poder é organizado: quem governa e como é escolhido. O texto vem da API e ainda não é verificado; toque no nome do regime, quando houver, para ver o verbete.',
  'Capital': 'Sede do governo, segundo a API do Atlas. Alguns países têm mais de uma capital (executiva, legislativa, judiciária); no globo, cada uma recebe uma estrela.',
  'Região': 'Grande região do mundo em que o país costuma ser classificado. A classificação vem da API e serve para agrupar, não para delimitar fronteiras.',
  'Idiomas': 'Línguas faladas no país, segundo a API do Atlas. Inclui idiomas oficiais e, às vezes, de uso comum; a lista não mede quantos falantes cada um tem.',
  'Moedas': 'Moedas de curso legal, com o símbolo entre parênteses quando existe. Vem da API do Atlas.',
  'Organizações': 'Organizações internacionais de que o país é membro (ONU, blocos regionais, alianças). Toque no nome para o verbete, quando existir.',
  'Política hoje': 'Resumo curado do sistema político atual e de quem governa. A data de atualização aparece no fim do bloco: política muda rápido, confira antes de citar.',
  'Governantes': 'Chefes de Estado e de governo, atuais primeiro e depois o histórico (mais recentes no topo). Vem da API do Atlas; fotos trazem crédito e licença.',
  'Pessoas importantes': 'Nascidos ou ligados ao país, ordenados por relevância. O método de ordenação e a fonte aparecem abaixo da lista; o filtro por área usa as 50 primeiras.',
  'Pistas': 'Sinais para reconhecer o país em jogos como o GeoGuessr: lado da direção, código telefônico, domínio de internet, placas e alfabeto.',
  'História': 'Eventos principais, em ordem cronológica. Eventos marcados "sem fonte" ainda não foram verificados: não os trate como história estabelecida.',
  'Linhagem': 'De quais estados o país descende e quais vieram depois dele, e os nomes que teve ao longo do tempo.',
  'Notícias': 'O Atlas não tem notícias próprias: o link abre uma busca no Google Notícias.',
  'GeoGuessr': 'Material de apoio para o jogo GeoGuessr: um guia da comunidade (Plonk It) e pistas para reconhecer o país.',
  'Fontes': 'De onde vêm os dados deste painel, com licença e data da consulta.',
};
