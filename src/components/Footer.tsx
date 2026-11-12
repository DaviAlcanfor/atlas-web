import { isMock } from '../api';

// Attribution. Wording marked TODO must be confirmed against the API repo's README; do not guess license text.
export function Footer() {
  return (
    <>
      {/* Never let fake data pass as real: a build without VITE_API_URL is visibly marked. */}
      {isMock && <div className="mock-badge" role="note">DADOS DE TESTE (mock)</div>}
      <footer className="footer">
        Fronteiras: Natural Earth (domínio público). Fronteiras históricas: historical-basemaps (GPL-3.0). TODO: texto de atribuição e aviso de licença.
        Fatos e história: API do Atlas; cada fonte e sua licença aparecem no painel do país. TODO: texto de licença Wikidata / World Bank.
      </footer>
    </>
  );
}
