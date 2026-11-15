import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { useGlossary } from '../glossary';
import { EXPLANATIONS } from '../lib/explanations';
import { Tooltip } from './Tooltip';

/**
 * The (i) after a panel label (spec 021): hover/focus shows what the label means. Labels with a glossary entry use its short text and
 * a click opens the full entry; the others use the fixed text in lib/explanations.ts. No text = renders nothing.
 */
export function Hint({ k, text: own, label, id }: { k: string; text?: string; label?: string; id?: string }) {
  const g = useGlossary();
  const t = g.find(id, k); // `id`: a glossary entry for a label that is not its name (e.g. an indicator code)
  const text = own ?? t?.short ?? EXPLANATIONS[k];
  if (!text) return null;
  return (
    <Tooltip text={text}>
      {(aria) => (
        <button type="button" className="hint" {...aria} aria-label={`O que é: ${label ?? k}`} onClick={t ? () => g.open(t.id) : undefined}>
          <Info size={12} weight="light" aria-hidden="true" />
        </button>
      )}
    </Tooltip>
  );
}
