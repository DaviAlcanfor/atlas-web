// Spec 031: the country's main stock index. TradingView's free "mini symbol overview" widget, loaded only when the block is opened
// (third-party script + cookies: nothing loads for visitors who never open it). Indices the exchange does not license for the free
// widget get a link to TradingView instead.
import { useEffect, useRef, useState } from 'react';
import { STOCK_INDEX, tvUrl, type StockIndex } from '../lib/stockIndex';
import { Section } from './Section';

const SCRIPT = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';

function Widget({ ix }: { ix: StockIndex }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    // config is our own constant (symbol from lib/stockIndex.ts), never API or user text
    s.textContent = JSON.stringify({ symbol: ix.symbol, width: '100%', height: 200, locale: 'br', dateRange: '12M', colorTheme: 'dark', isTransparent: true, autosize: false, largeChartUrl: '' });
    el.appendChild(s);
    return () => { el.replaceChildren(); };
  }, [ix.symbol]);
  return <div className="tradingview-widget-container stock__widget" ref={box}><div className="tradingview-widget-container__widget" /></div>;
}

export function StockSection({ iso2 }: { iso2: string }) {
  const ix = STOCK_INDEX[iso2];
  const [opened, setOpened] = useState(false);
  if (!ix) return null;
  return (
    <Section title="Bolsa" fold onOpen={() => setOpened(true)}>
      <p className="note">Principal índice da bolsa: <b>{ix.name}</b>.</p>
      {ix.embed ? (opened && <Widget ix={ix} />) : (
        <p className="note">A bolsa deste país não libera o índice para exibição gratuita fora do TradingView.</p>
      )}
      <p className="src">
        <a href={tvUrl(ix.symbol)} target="_blank" rel="noreferrer noopener">{ix.embed ? 'Cotação' : 'Ver a cotação'} por TradingView</a>
        {ix.embed && ' · com atraso de 15 min (D) ou fechamento do dia anterior (E)'}
      </p>
    </Section>
  );
}
