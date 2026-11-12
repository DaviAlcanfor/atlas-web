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
