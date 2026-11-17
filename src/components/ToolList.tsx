// spec 036 A: "Consultas" of one assistant turn. Open while the answer streams (spinner on the latest call), collapsed once it ends.
import { flagPreviewUrl } from '../lib/url';
import { argChips, toolName, type ToolCall } from '../lib/chatTools';

export function ToolList({ tools, live }: { tools: ToolCall[]; live: boolean }) {
  if (!tools.length) return null;
  return (
    // `key` flips on live -> done so the list re-mounts collapsed when the answer ends
    <details className="chat__calls" key={live ? 'live' : 'done'} open={live}>
      <summary>Consultas ({tools.length})</summary>
      <ul>
        {tools.map((t, i) => (
          <li key={i}>
            {live && i === tools.length - 1 ? <span className="spinner" aria-hidden="true" /> : <span className="chat__tick" aria-hidden="true">›</span>}
            <b>{toolName(t.name)}</b>
            {argChips(t.args).map((c, j) => (
              <span key={j} className="chat__chip">{c.key}: {c.flag && <img src={flagPreviewUrl(c.flag)} alt="" width={14} height={10} loading="lazy" />}{c.value}</span>
            ))}
          </li>
        ))}
      </ul>
    </details>
  );
}
