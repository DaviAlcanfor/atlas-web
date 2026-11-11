import { regimePalette } from './palette';

/** regime text -> color. The API's `regime` is free text, so we color per distinct string (sorted => stable colors). */
export function regimeColors(regimes: Map<string, string>): Map<string, string> {
  const keys = [...new Set(regimes.values())].sort((a, b) => a.localeCompare(b));
  return new Map(keys.map((k, i) => [k, regimePalette[i % regimePalette.length]!]));
}
