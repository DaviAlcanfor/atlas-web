import type { PersonDomain } from '../api/types';

export const DOMAIN_LABEL: Record<PersonDomain, string> = {
  arts: 'Artes', business_law: 'Negócios e direito', exploration: 'Exploração', humanities: 'Humanidades',
  institutions: 'Instituições', public_figure: 'Figuras públicas', science_technology: 'Ciência e tecnologia', sports: 'Esportes',
};

/** Pantheon publishes occupations in English UPPER CASE (contract). pt-BR names, keyed by the published text. */
const OCCUPATIONS: Readonly<Record<string, string>> = {
  'ACTIVIST': 'Ativista', 'ACTOR': 'Ator', 'ANTHROPOLOGIST': 'Antropólogo', 'ARCHAEOLOGIST': 'Arqueólogo', 'ARCHER': 'Arqueiro',
  'ARCHITECT': 'Arquiteto', 'ARTIST': 'Artista', 'ASTRONAUT': 'Astronauta', 'ASTRONOMER': 'Astrônomo', 'ATHLETE': 'Atleta',
  'BASEBALL PLAYER': 'Jogador de beisebol', 'BASKETBALL PLAYER': 'Jogador de basquete', 'BIOLOGIST': 'Biólogo', 'BOTANIST': 'Botânico',
  'BOXER': 'Boxeador', 'BUSINESSPERSON': 'Empresário', 'CARTOGRAPHER': 'Cartógrafo', 'CHEF': 'Chef de cozinha', 'CHEMIST': 'Químico',
  'CHESS PLAYER': 'Enxadrista', 'COACH': 'Treinador', 'COMEDIAN': 'Comediante', 'COMIC ARTIST': 'Quadrinista', 'COMPOSER': 'Compositor',
  'COMPUTER SCIENTIST': 'Cientista da computação', 'CONDUCTOR': 'Maestro', 'CRICKETER': 'Jogador de críquete', 'CRITIC': 'Crítico',
  'CYCLIST': 'Ciclista', 'DANCER': 'Dançarino', 'DESIGNER': 'Designer', 'DIPLOMAT': 'Diplomata', 'ECONOMIST': 'Economista',
  'ENGINEER': 'Engenheiro', 'ENTREPRENEUR': 'Empreendedor', 'EXPLORER': 'Explorador', 'FASHION DESIGNER': 'Estilista',
  'FENCER': 'Esgrimista', 'FIGURE SKATER': 'Patinador artístico', 'FILM DIRECTOR': 'Cineasta', 'FOOTBALL PLAYER': 'Jogador de futebol americano',
  'GAME DESIGNER': 'Designer de jogos', 'GEOGRAPHER': 'Geógrafo', 'GEOLOGIST': 'Geólogo', 'GOLFER': 'Golfista', 'GYMNAST': 'Ginasta',
  'HISTORIAN': 'Historiador', 'ICE HOCKEY PLAYER': 'Jogador de hóquei no gelo', 'INVENTOR': 'Inventor', 'JOURNALIST': 'Jornalista',
  'JUDGE': 'Juiz', 'JUDOKA': 'Judoca', 'JURIST': 'Jurista', 'LINGUIST': 'Linguista', 'MARTIAL ARTIST': 'Artista marcial',
  'MATHEMATICIAN': 'Matemático', 'MILITARY PERSONNEL': 'Militar', 'MODEL': 'Modelo', 'MOUNTAINEER': 'Alpinista', 'MUSICIAN': 'Músico',
  'NAVIGATOR': 'Navegador', 'NOBLEMAN': 'Nobre', 'NOVELIST': 'Romancista', 'OLYMPIC ATHLETE': 'Atleta olímpico', 'PAINTER': 'Pintor',
  'PHILOSOPHER': 'Filósofo', 'PHOTOGRAPHER': 'Fotógrafo', 'PHYSICIAN': 'Médico', 'PHYSICIST': 'Físico', 'PILOT': 'Piloto',
  'PLAYWRIGHT': 'Dramaturgo', 'POET': 'Poeta', 'POLITICIAN': 'Político', 'PRIEST': 'Sacerdote', 'PRODUCER': 'Produtor',
  'PROGRAMMER': 'Programador', 'PSYCHIATRIST': 'Psiquiatra', 'PSYCHOLOGIST': 'Psicólogo', 'RACING DRIVER': 'Piloto de corrida',
  'RELIGIOUS FIGURE': 'Líder religioso', 'ROYAL': 'Membro da realeza', 'RUGBY PLAYER': 'Jogador de rúgbi', 'SAILOR': 'Marinheiro',
  'SCULPTOR': 'Escultor', 'SINGER': 'Cantor', 'SKIER': 'Esquiador', 'SOCCER PLAYER': 'Jogador de futebol', 'SOCIAL ACTIVIST': 'Ativista social',
  'SOCIOLOGIST': 'Sociólogo', 'STATESMAN': 'Estadista', 'SURFER': 'Surfista', 'SWIMMER': 'Nadador', 'TELEVISION DIRECTOR': 'Diretor de TV',
  'TELEVISION PRESENTER': 'Apresentador de TV', 'TENNIS PLAYER': 'Tenista', 'THEOLOGIST': 'Teólogo',
  'TRACK AND FIELD ATHLETE': 'Atleta de atletismo', 'VOLLEYBALL PLAYER': 'Jogador de vôlei', 'WRESTLER': 'Lutador', 'WRITER': 'Escritor',
  'ZOOLOGIST': 'Zoólogo',
};

/** pt-BR occupation; unknown values fall back to the original text, lower case with a leading capital (never invented). */
export function occupationPt(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const hit = OCCUPATIONS[raw.trim().toUpperCase()];
  if (hit) return hit;
  const low = raw.trim().toLowerCase();
  return low.charAt(0).toUpperCase() + low.slice(1);
}
