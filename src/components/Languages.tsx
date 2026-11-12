// Spec 017: "Idiomas" with every status told apart by chip style (not by colour alone): filled, outlined, dashed, dotted, hand icon, faded.
import { useState } from 'react';
import { HandWaving } from '@phosphor-icons/react/dist/csr/HandWaving';
import type { LanguageSpoken } from '../api/types';
import { languageTip, sortLanguages, statusesIn, STATUS_LABEL, VISIBLE } from '../lib/languages';
import { safeHref } from '../lib/url';
import { Section } from './Section';
import { Tooltip } from './Tooltip';

function LangChip({ l }: { l: LanguageSpoken }) {
  const href = safeHref(l.wikipedia_url);
  const cls = `lang lang--${l.status}`;
  const inner = <>{l.status === 'sign' && <HandWaving size={14} weight="light" aria-hidden="true" />}{l.name}</>;
  return (
    <Tooltip text={languageTip(l)}>
      {(aria) => href
        ? <a className={cls} href={href} target="_blank" rel="noreferrer noopener" {...aria}>{inner}</a>
        : <span className={cls} tabIndex={0} {...aria}>{inner}</span>}
    </Tooltip>
  );
}

export function LanguagesSection({ items }: { items: LanguageSpoken[] }) {
  const [all, setAll] = useState(false);
  const sorted = sortLanguages(items);
  const shown = all ? sorted : sorted.slice(0, VISIBLE);
  return (
    <Section title="Idiomas">
      <div className="langs">
        <ul className="lang-legend" aria-label="Legenda dos estilos">
          {statusesIn(sorted).map((s) => <li key={s}><span className={`lang lang--${s} lang--sample`}>{s === 'sign' && <HandWaving size={12} weight="light" aria-hidden="true" />}Aa</span>{STATUS_LABEL[s]}</li>)}
        </ul>
        <ul className="chips lang-chips">{shown.map((l) => <li key={`${l.code ?? l.name}-${l.status}`}><LangChip l={l} /></li>)}</ul>
        {sorted.length > VISIBLE && (
          <button className="more-btn" aria-expanded={all} onClick={() => setAll(!all)}>{all ? 'ver menos' : `ver todos (${sorted.length})`}</button>
        )}
      </div>
    </Section>
  );
}
