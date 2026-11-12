/** Only http(s) URLs from API data become links (blocks `javascript:` etc.). */
export const safeHref = (url: string | null | undefined): string | undefined => {
  try {
    return url && /^https?:$/.test(new URL(url).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
};
export const day = (iso: string) => iso.slice(0, 10);
/** Small flag for the hover preview (spec 014). The ISO2 is validated before it goes into a URL; anything else = no flag. */
export const flagPreviewUrl = (iso2: string | null | undefined): string | undefined =>
  iso2 && /^[A-Z]{2}$/.test(iso2) ? `https://flagcdn.com/w80/${iso2.toLowerCase()}.png` : undefined;
/** w160 flag for the flag layer's atlas (spec 021): 160 px wide at the flag's real aspect ratio. */
export const flagAtlasUrl = (iso2: string | null | undefined): string | undefined =>
  iso2 && /^[A-Z]{2}$/.test(iso2) ? `https://flagcdn.com/w160/${iso2.toLowerCase()}.png` : undefined;
/** w640 flag for the selected country's backdrop (spec 002), straight from the ISO2 so it does not wait on the API. */
export const flagLargeUrl = (iso2: string | null | undefined): string | undefined =>
  iso2 && /^[A-Z]{2}$/.test(iso2) ? `https://flagcdn.com/w640/${iso2.toLowerCase()}.png` : undefined;
/** flagcdn SVG URL from the API -> its PNG variant (WebGL can't sample SVG; OG cards prefer PNG). Anything else -> null (no flag). */
export function flagPngUrl(flagUrl: string | null | undefined): string | null {
  try {
    const u = new URL(flagUrl ?? '');
    const code = /^\/(?:w\d+\/)?([a-z]{2}(?:-[a-z0-9]+)?)\.(?:svg|png)$/.exec(u.pathname)?.[1];
    return u.protocol === 'https:' && u.hostname === 'flagcdn.com' && code ? `https://flagcdn.com/w640/${code}.png` : null;
  } catch {
    return null;
  }
}
