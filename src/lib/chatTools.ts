// spec 036 A: what the chat shows for each tool the model called ("Consultas"): a pt-BR name + the arguments as key: value chips.
export interface ToolCall { name: string; args: Record<string, unknown> }
export interface Chip { key: string; value: string; flag?: string } // flag = the ISO code of a country value

const NAMES: Record<string, string> = {
  search: 'Busca', list_countries: 'Lista de países', get_country: 'País', get_leaders: 'Governantes', get_people: 'Pessoas',
  get_profile: 'Perfil', get_economy: 'Economia', get_trade: 'Comércio', get_history: 'História', get_languages: 'Idiomas',
  get_currency: 'Moeda', glossary: 'Glossário', list_indicators: 'Indicadores', indicator_ranking: 'Ranking de indicador',
};
const KEYS: Record<string, string> = {
  q: 'busca', query: 'busca', iso2: 'país', country: 'país', code: 'código', id: 'id', indicator: 'indicador', limit: 'limite', year: 'ano',
};
const REGIONS = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

/** "get_economy" -> "Economia"; unknown ids become readable ("some_tool" -> "Some tool") instead of leaking the raw id. */
export const toolName = (name: string) => NAMES[name] ?? (name.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) || 'Consulta');

function country(v: string): Pick<Chip, 'value' | 'flag'> | null {
  if (!/^[A-Za-z]{2}$/.test(v)) return null;
  try { const n = REGIONS.of(v.toUpperCase()); return n && n !== v.toUpperCase() ? { value: n, flag: v.toUpperCase() } : null; } catch { return null; }
}

/** One chip per argument; a list becomes one chip per item. Country codes (iso2 / country keys only) get a flag and their pt-BR name. */
export function argChips(args: Record<string, unknown>): Chip[] {
  return Object.entries(args).flatMap(([k, v]) => {
    if (v === null || v === undefined || v === '') return [];
    const key = KEYS[k] ?? k.replace(/_/g, ' ');
    return (Array.isArray(v) ? v : [v]).map((x): Chip => {
      const s = typeof x === 'string' ? x : JSON.stringify(x);
      return { key, ...(/iso|countr/i.test(k) ? country(s) : null) ?? { value: s } };
    });
  });
}
