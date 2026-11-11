/** Only http(s) URLs from API data become links (blocks `javascript:` etc.). */
export const safeHref = (url: string | null | undefined): string | undefined => {
  try {
    return url && /^https?:$/.test(new URL(url).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
};
export const day = (iso: string) => iso.slice(0, 10);
