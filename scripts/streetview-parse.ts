// Parser for the "Current coverage" table of Wikipedia's "Google Street View coverage" (wikitext).
// Markup legend on the page: bold + "*" = public Street View; bold without "*" = official but restricted; plain text = only
// businesses and/or tourist attractions.
export type Coverage = 'full' | 'partial' | 'limited';

const clean = (s: string) =>
  s
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1');

/** [country name as written on the page, coverage level] for every row of the "Current coverage" table. */
export function parseCoverage(wikitext: string): [string, Coverage][] {
  const start = wikitext.indexOf('===Current coverage===');
  const end = wikitext.indexOf('=== Future coverage ===');
  if (start < 0 || end < start) throw new Error('coverage table not found: the page layout changed');
  const out: [string, Coverage][] = [];
  for (const row of wikitext.slice(start, end).split(/\n\|-\s*\n/).slice(1)) {
    const cell = clean(row.replace(/^\|\s*/, '')).split(/\|\||\n/)[0]!.trim();
    if (!cell || cell.startsWith('!') || cell.startsWith('|}')) continue;
    const star = cell.includes('*');
    const bold = cell.includes("'''");
    const name = cell.replace(/'''|\*/g, '').trim();
    if (name) out.push([name, bold ? (star ? 'full' : 'partial') : 'limited']);
  }
  return out;
}
