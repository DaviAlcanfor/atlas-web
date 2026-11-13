// Per-icon imports: the package barrel pulls ~9000 modules (slow dev server and tests).
// Panel block icons (spec 004 web part, design system in spec 013): Phosphor, weight "light", one family only.
import { Bank } from '@phosphor-icons/react/dist/csr/Bank';
import { BookOpen } from '@phosphor-icons/react/dist/csr/BookOpen';
import { Compass } from '@phosphor-icons/react/dist/csr/Compass';
import { Coins } from '@phosphor-icons/react/dist/csr/Coins';
import { Crown } from '@phosphor-icons/react/dist/csr/Crown';
import { GitBranch } from '@phosphor-icons/react/dist/csr/GitBranch';
import { GlobeHemisphereWest } from '@phosphor-icons/react/dist/csr/GlobeHemisphereWest';
import { GridFour } from '@phosphor-icons/react/dist/csr/GridFour';
import { Hourglass } from '@phosphor-icons/react/dist/csr/Hourglass';
import { Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { Newspaper } from '@phosphor-icons/react/dist/csr/Newspaper';
import { Ruler } from '@phosphor-icons/react/dist/csr/Ruler';
import { Scales } from '@phosphor-icons/react/dist/csr/Scales';
import { Translate } from '@phosphor-icons/react/dist/csr/Translate';
import { Users } from '@phosphor-icons/react/dist/csr/Users';
import { UsersThree } from '@phosphor-icons/react/dist/csr/UsersThree';
import type { Icon } from '@phosphor-icons/react/lib';

/** Panel block label -> icon. Labels not listed get no icon. */
const LABEL_ICON: Readonly<Record<string, Icon>> = {
  'População': Users,
  'Área': Ruler,
  'Densidade': GridFour,
  'Regime': Bank,
  'Idiomas': Translate,
  'Moedas': Coins,
  'Organizações': GlobeHemisphereWest,
  'Política hoje': Scales,
  'História': Hourglass,
  'Notícias': Newspaper,
  'GeoGuessr': MapPin,
  'Fontes': BookOpen,
  'Linhagem': GitBranch,
  'Governantes': Crown,
  'Pessoas importantes': UsersThree,
  'Pistas': Compass,
  'Ideias políticas': Lightbulb,
};

export function LabelIcon({ label }: { label: string }) {
  const I = LABEL_ICON[label];
  return I ? <I className="icon" size={15} weight="light" aria-hidden="true" /> : null;
}
