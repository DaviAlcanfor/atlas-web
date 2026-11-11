import { isMock } from '../api';

// Attribution. Wording marked TODO must be confirmed against the API repo's README; do not guess license text.
export function Footer() {
  return (
    <footer className="footer">
      {isMock && <strong>MOCK DATA · </strong>}
      Borders: Natural Earth (public domain). Historical borders: historical-basemaps (GPL-3.0) — TODO: attribution and license notice wording.
      Facts and history: Atlas API; each upstream source and its license is listed in the country panel — TODO: Wikidata / World Bank license text.
    </footer>
  );
}
