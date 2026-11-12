// MOCK languages_spoken (contract v1.2). The real ETL output was not available when this front was built, so BR is HAND-BUILT from
// spec 017's examples and JP from well-known facts. No speaker counts are invented: `speakers` is null. Replace with real samples later.
import type { LanguageSpoken } from '../types';

const L = (name: string, status: LanguageSpoken['status'], o: Partial<LanguageSpoken> = {}): LanguageSpoken => ({
  code: null, name, status, where: null, speakers: null, family: null, endangerment: null, wikipedia_url: null, ...o,
});

export const LANGUAGES_SPOKEN: Record<string, LanguageSpoken[]> = {
  BR: [
    L('português', 'official', { code: 'pt', family: 'românica', wikipedia_url: 'https://pt.wikipedia.org/wiki/L%C3%ADngua_portuguesa' }),
    L('nheengatu', 'co_official', { code: 'yrl', where: 'São Gabriel da Cachoeira (AM)', family: 'tupi', endangerment: 'severamente em perigo' }),
    L('baniwa', 'co_official', { code: 'bwi', where: 'São Gabriel da Cachoeira (AM)', family: 'aruaque' }),
    L('tucano', 'co_official', { code: 'tuo', where: 'São Gabriel da Cachoeira (AM)', family: 'tucana' }),
    L('guarani mbyá', 'indigenous', { code: 'gun', family: 'tupi-guarani', endangerment: 'vulnerável' }),
    L('caingangue', 'indigenous', { code: 'kgp', family: 'jê', endangerment: 'vulnerável' }),
    L('hunsriqueano rio-grandense', 'immigrant', { code: 'hrx', family: 'germânica', endangerment: 'vulnerável' }),
    L('talian', 'immigrant', { code: 'vec', family: 'românica' }),
    L('pomerano', 'immigrant', { code: 'pdt', family: 'germânica', endangerment: 'vulnerável' }),
    L('Libras', 'sign', { code: 'bzs', family: 'língua de sinais' }),
    L('tupi antigo', 'historical', { code: 'tpn', family: 'tupi', endangerment: 'extinta' }),
  ],
  JP: [
    L('japonês', 'official', { code: 'ja', family: 'japônica' }),
    L('ainu', 'indigenous', { code: 'ain', family: 'isolada', endangerment: 'criticamente em perigo' }),
    L('língua de sinais japonesa', 'sign', { code: 'jsl' }),
  ],
};
