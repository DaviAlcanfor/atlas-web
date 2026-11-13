import { isMock } from '../api';

// Attribution of every source in use (licences as recorded in the API repo's README). Each fact block also names its own source.
export function Footer() {
  return (
    <>
      {/* Never let fake data pass as real: a build without NEXT_PUBLIC_API_URL is visibly marked. */}
      {isMock && <div className="mock-badge" role="note">DADOS DE TESTE (mock)</div>}
      <footer className="footer">
        Mapa: Natural Earth (domínio público). Dados: Wikidata (CC0), Banco Mundial (CC BY 4.0), PNUD (CC BY 3.0 IGO), Banco Central
        Europeu, Pantheon e Wikipédia (CC BY-SA 4.0). Bandeiras: flagcdn e Wikimedia Commons. Cada dado mostra sua fonte no painel.
      </footer>
    </>
  );
}
