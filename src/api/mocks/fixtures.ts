// MOCK DATA for development without the API. Shapes follow contract/CONTRACT.md v1.0 exactly (validated by tests).
// Text for AT/BR/DE/EG/JP is the user's own curated content; TR/RU/RS/polities are minimal. No numbers are invented:
// unknown = null / empty. Snapshots 1815/1914/1945 are FAKE (no geometry file ships with them yet).
import type { CountryDetail, CountrySummary, Event, PolityDetail, SnapshotInfo, SnapshotLinks, Source } from '../types';

const T = '2026-11-10T00:00:00Z';
export const MOCK_SOURCE: Source = { id: 'mock', title: 'Mock fixture (not real API data)', url: null, license: null, retrieved_at: null };

const ev = (id: string, year_start: number, title: string, kind: Event['kind'] = 'political', precision: Event['precision'] = 'exact'): Event => ({
  id, year_start, year_end: null, precision, title, summary: '', kind, source_ids: [], // like the live API: curated events of the 5 seed countries have no source yet
});
/** event that cites the mock source */
const sourced = (e: Event): Event => ({ ...e, source_ids: ['mock'] });
const politics = (system: string, note: string) => ({ system, note, updated_at: T });

const country = (c: Partial<CountryDetail> & Pick<CountryDetail, 'iso2' | 'polity_id' | 'name'>): CountryDetail => ({
  official_name: null, capital: null, flag_url: null, region: null, regime: null, summary: null,
  languages: [], currencies: [], population: null, area_km2: null, memberships: [], politics: null,
  timeline: [], sources: [MOCK_SOURCE], updated_at: T, ...c,
});

export const COUNTRIES: CountryDetail[] = [
  country({ iso2: 'AT', polity_id: 'austria', name: 'Áustria', capital: 'Viena', region: 'Europa', regime: 'República parlamentar federal',
    summary: 'País alpino da Europa Central, centro do antigo Império Habsburgo.',
    languages: [{ code: 'de', name: 'Alemão' }], currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    memberships: ['União Europeia'],
    politics: politics('Presidente como chefe de Estado; chanceler como chefe de governo', 'Governos de coalizão são comuns; confira uma fonte atual.'),
    timeline: [ev('at-1867', 1867, 'Criação do Império Austro-Húngaro'), ev('at-1918', 1918, 'Fim da monarquia após a Primeira Guerra'),
      ev('at-1938', 1938, 'Anexação pela Alemanha nazista (Anschluss)', 'war'), ev('at-1955', 1955, 'Tratado de Estado: soberania restaurada e neutralidade', 'treaty'),
      ev('at-1995', 1995, 'Entrada na União Europeia', 'political')] }),
  country({ iso2: 'BR', polity_id: 'brazil', name: 'Brasil', capital: 'Brasília', region: 'Américas', regime: 'República presidencialista federal',
    summary: 'Maior país da América do Sul, único de língua portuguesa na região.',
    languages: [{ code: 'pt', name: 'Português' }], currencies: [{ code: 'BRL', name: 'Real', symbol: 'R$' }],
    politics: politics('Presidencialismo com Congresso bicameral (Câmara + Senado)', 'Cargos e partidos no poder mudam por eleição; confira uma fonte atual.'),
    timeline: [ev('br-1500', 1500, 'Chegada da frota de Cabral; início da colonização portuguesa'), ev('br-1822', 1822, 'Independência declarada por Dom Pedro I'),
      ev('br-1889', 1889, 'Proclamação da República'), ev('br-1985', 1985, 'Fim da ditadura militar (iniciada em 1964)'), ev('br-1988', 1988, 'Promulgação da Constituição vigente')] }),
  country({ iso2: 'DE', polity_id: 'germany', name: 'Alemanha', capital: 'Berlim', region: 'Europa', regime: 'República parlamentar federal',
    summary: 'Maior economia da Europa; federação de 16 estados.',
    politics: politics('Chanceler lidera o governo; presidente tem papel cerimonial', 'Governos de coalizão são a regra; confira uma fonte atual.'),
    timeline: [ev('de-1871', 1871, 'Unificação sob o Império Alemão'), ev('de-1933', 1933, 'Ascensão do regime nazista'),
      ev('de-1949', 1949, 'Divisão em República Federal (oeste) e RDA (leste)'), ev('de-1990', 1990, 'Reunificação alemã')] }),
  country({ iso2: 'EG', polity_id: 'egypt', name: 'Egito', capital: 'Cairo', region: 'África', regime: 'República semipresidencialista',
    summary: 'Ponte entre África e Ásia; uma das civilizações mais antigas do mundo.',
    politics: politics('Presidente forte com Parlamento unicameral', 'Confira uma fonte atual para cargos e leis recentes.'),
    timeline: [ev('eg--2560', -2560, 'Construção aproximada da Grande Pirâmide de Gizé', 'cultural', 'circa'), ev('eg-1869', 1869, 'Inauguração do Canal de Suez', 'economic'),
      ev('eg-1952', 1952, 'Revolução dos Oficiais Livres derruba a monarquia'), ev('eg-1979', 1979, 'Tratado de paz com Israel', 'treaty'),
      ev('eg-2011', 2011, 'Revolta popular encerra o governo de Mubarak')] }),
  country({ iso2: 'JP', polity_id: 'japan', name: 'Japão', capital: 'Tóquio', region: 'Ásia', regime: 'Monarquia constitucional parlamentar',
    summary: 'Arquipélago do leste asiático; imperador simbólico, poder com o Parlamento.',
    languages: [{ code: 'ja', name: 'Japonês' }], currencies: [{ code: 'JPY', name: 'Iene', symbol: '¥' }],
    politics: politics('Primeiro-ministro lidera o governo; Parlamento (Dieta) bicameral', 'Cargos mudam com frequência; confira uma fonte atual.'),
    timeline: [ev('jp-1603', 1603, 'Início do xogunato Tokugawa e longo período de isolamento'), ev('jp-1868', 1868, 'Restauração Meiji: modernização e fim do xogunato'),
      ev('jp-1945', 1945, 'Rendição ao fim da Segunda Guerra Mundial', 'war'), ev('jp-1947', 1947, 'Entrada em vigor da Constituição atual (pacifista)')] }),
  country({ iso2: 'TR', polity_id: 'turkey', name: 'Turquia', capital: 'Ancara', region: 'Ásia',
    timeline: [sourced(ev('tr-1923', 1923, 'Proclamação da República da Turquia'))] }),
  country({ iso2: 'RU', polity_id: 'russia', name: 'Rússia', capital: 'Moscou', region: 'Europa',
    timeline: [sourced(ev('ru-1991', 1991, 'Dissolução da União Soviética'))] }),
  country({ iso2: 'RS', polity_id: 'serbia', name: 'Sérvia', capital: 'Belgrado', region: 'Europa',
    timeline: [] }), // deliberately empty: exercises the "no timeline" state
];

/** Micro-state with no content, to exercise `marker` and the "no data yet" panel. */
const MONACO: CountrySummary = { iso2: 'MC', polity_id: 'monaco', name: 'Mônaco', capital: 'Mônaco', region: 'Europa', regime: null, has_content: false, marker: { lat: 43.7384, lng: 7.4246 } };

export const COUNTRY_SUMMARIES: CountrySummary[] = [
  ...COUNTRIES.map((c): CountrySummary => ({ iso2: c.iso2, polity_id: c.polity_id, name: c.name, capital: c.capital, region: c.region, regime: c.regime, has_content: true, marker: null })),
  MONACO,
];

type Link = PolityDetail['predecessors'][number];
const link = (polity_id: string, name: string, year: number, kind: Link['kind']): Link => ({ polity_id, name, year, kind });
const polity = (p: Partial<PolityDetail> & Pick<PolityDetail, 'id' | 'name' | 'type' | 'start_year' | 'end_year'>): PolityDetail => ({
  iso2: null, start_precision: 'exact', end_precision: p.end_year === null ? null : 'exact', names: [{ name: p.name, from_year: p.start_year, to_year: p.end_year }],
  predecessors: [], successors: [], regime: null, summary: null, politics: null, timeline: [], wikipedia: null, sources: [MOCK_SOURCE], updated_at: T, ...p,
});

const HISTORICAL: PolityDetail[] = [
  polity({ id: 'ottoman-empire', name: 'Império Otomano', type: 'empire', start_year: 1299, start_precision: 'circa', end_year: 1922,
    successors: [link('turkey', 'Turquia', 1923, 'succeeded')],
    timeline: [sourced(ev('ott-1453', 1453, 'Conquista de Constantinopla', 'war')), sourced(ev('ott-1922', 1922, 'Abolição do sultanato'))],
    wikipedia: { title: 'Império Otomano', url: 'https://pt.wikipedia.org/wiki/Imp%C3%A9rio_Otomano' } }),
  polity({ id: 'austria-hungary', name: 'Áustria-Hungria', type: 'empire', start_year: 1867, end_year: 1918, successors: [link('austria', 'Áustria', 1918, 'succeeded')] }),
  polity({ id: 'german-empire', name: 'Império Alemão', type: 'empire', start_year: 1871, end_year: 1918, successors: [link('weimar-republic', 'República de Weimar', 1918, 'succeeded')] }),
  polity({ id: 'weimar-republic', name: 'República de Weimar', type: 'republic', start_year: 1918, end_year: 1933,
    predecessors: [link('german-empire', 'Império Alemão', 1918, 'succeeded')], successors: [link('nazi-germany', 'Alemanha Nazista', 1933, 'succeeded')] }),
  polity({ id: 'nazi-germany', name: 'Alemanha Nazista', type: 'other', start_year: 1933, end_year: 1945,
    predecessors: [link('weimar-republic', 'República de Weimar', 1933, 'succeeded')],
    successors: [link('east-germany', 'Alemanha Oriental', 1949, 'split'), link('germany', 'Alemanha', 1949, 'split')] }),
  polity({ id: 'east-germany', name: 'Alemanha Oriental', type: 'republic', start_year: 1949, end_year: 1990,
    predecessors: [link('nazi-germany', 'Alemanha Nazista', 1949, 'split')], successors: [link('germany', 'Alemanha', 1990, 'absorbed')] }),
  polity({ id: 'soviet-union', name: 'União Soviética', type: 'federation', start_year: 1922, end_year: 1991, successors: [link('russia', 'Rússia', 1991, 'succeeded')] }),
  polity({ id: 'yugoslavia', name: 'Iugoslávia', type: 'federation', start_year: 1918, end_year: 1992, successors: [link('serbia', 'Sérvia', 1992, 'split')] }), // no timeline on purpose
];
const MODERN: PolityDetail[] = COUNTRIES.map((c) =>
  polity({ id: c.polity_id, name: c.name, type: 'republic', start_year: c.polity_id === 'turkey' ? 1923 : 1900, end_year: null, iso2: c.iso2, regime: c.regime, summary: c.summary,
    politics: c.politics, timeline: c.timeline, predecessors: c.polity_id === 'turkey' ? [link('ottoman-empire', 'Império Otomano', 1923, 'succeeded')] : [] }),
);
// ponytail: modern polities' start_year is a placeholder (1900) for every country but Turkey; the real API owns these values.
export const POLITIES: PolityDetail[] = [...HISTORICAL, ...MODERN];

// FAKE snapshots. feature_count / link_coverage are made up for mock mode only.
export const SNAPSHOTS: SnapshotInfo[] = [1815, 1914, 1945].map((year) => ({
  year, geometry_url: `/data/historical/world_${year}.geojson`, feature_count: 0, link_coverage: 0.5,
}));
export const LINKS: Record<number, SnapshotLinks> = {
  1815: { snapshot_year: 1815, links: [
    { source_name: 'Ottoman Empire', polity_id: 'ottoman-empire', status: 'curated' },
    { source_name: 'Austrian Empire', polity_id: null, status: 'unresolved' } ] },
  1914: { snapshot_year: 1914, links: [
    { source_name: 'Ottoman Empire', polity_id: 'ottoman-empire', status: 'curated' },
    { source_name: 'Austria-Hungary', polity_id: 'austria-hungary', status: 'auto' },
    { source_name: 'German Empire', polity_id: 'german-empire', status: 'curated' },
    { source_name: 'Russian Empire', polity_id: null, status: 'unresolved' } ] },
  1945: { snapshot_year: 1945, links: [
    { source_name: 'Soviet Union', polity_id: 'soviet-union', status: 'curated' },
    { source_name: 'Yugoslavia', polity_id: 'yugoslavia', status: 'curated' },
    { source_name: 'Germany', polity_id: 'nazi-germany', status: 'auto' } ] },
};
