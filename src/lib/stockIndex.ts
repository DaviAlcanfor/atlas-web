// Spec 031: the main stock index of each country, shown with TradingView's free widget (delayed 15 min or end of day, TradingView
// branding kept, as its terms require). `embed: false` = the exchange does not license the index for the free widget ("Permissão
// negada" in the widget), so the panel links to TradingView instead. Every symbol was rendered and checked on 2026-11-17.
export interface StockIndex { symbol: string; name: string; embed: boolean }

const E = (symbol: string, name: string): StockIndex => ({ symbol, name, embed: true });
const L = (symbol: string, name: string): StockIndex => ({ symbol, name, embed: false });

export const STOCK_INDEX: Record<string, StockIndex> = {
  BR: E('BMFBOVESPA:IBOV', 'Ibovespa'), FR: E('EURONEXT:PX1', 'CAC 40'), CA: E('TSX:TSX', 'S&P/TSX Composite'),
  CL: E('BCS:SP_IPSA', 'S&P IPSA'), NL: E('EURONEXT:AEX', 'AEX'), BE: E('EURONEXT:BEL20', 'BEL 20'), PT: E('EURONEXT:PSI20', 'PSI'),
  SE: E('OMXSTO:OMXS30', 'OMX Stockholm 30'), NO: E('OSL:OBX', 'OBX'), DK: E('OMXCOP:OMXC25', 'OMX Copenhagen 25'),
  FI: E('OMXHEX:OMXH25', 'OMX Helsinki 25'), GR: E('ATHEX:GD', 'ATHEX Composite'), IL: E('TASE:TA35', 'TA-35'), EG: E('EGX:EGX30', 'EGX 30'),
  MA: E('CSEMA:MASI', 'MASI'), IE: E('EURONEXT:ISEQ', 'ISEQ 20'), HU: E('BET:BUX', 'BUX'), CN: E('SSE:000001', 'SSE Composite (Xangai)'),
  HK: E('HSI:HSI', 'Hang Seng'), IT: E('INDEX:FTSEMIB', 'FTSE MIB'), ES: E('BME:IBC', 'IBEX 35'), RU: E('MOEX:IMOEX', 'MOEX Russia'),
  DE: E('XETR:DAX', 'DAX'), IN: E('BSE:SENSEX', 'Sensex'), CH: E('SIX:SMI', 'SMI'), ID: E('IDX:COMPOSITE', 'IDX Composite'),
  PL: E('GPW:WIG20', 'WIG20'), AT: E('VIE:ATX', 'ATX'), CO: E('BVC:COLCAP', 'COLCAP'),
  US: L('SP:SPX', 'S&P 500'), JP: L('TVC:NI225', 'Nikkei 225'), GB: L('FTSE:UKX', 'FTSE 100'), KR: L('KRX:KOSPI', 'KOSPI'),
  AU: L('ASX:XJO', 'S&P/ASX 200'), MX: L('BMV:ME', 'S&P/BMV IPC'), AR: L('BCBA:IMV', 'S&P Merval'), TR: L('BIST:XU100', 'BIST 100'),
  SA: L('TADAWUL:TASI', 'Tadawul All Share'), TW: L('TWSE:TAIEX', 'TAIEX'), SG: L('TVC:STI', 'Straits Times'), TH: L('SET:SET', 'SET'),
  MY: L('MYX:FBMKLCI', 'FTSE Bursa Malaysia KLCI'), PH: L('PSE:PSEI', 'PSEi'), VN: L('HOSE:VNINDEX', 'VN-Index'),
  NZ: L('NZX:NZ50G', 'S&P/NZX 50'), PK: L('PSX:KSE100', 'KSE 100'), AE: L('ADX:FADGI', 'FTSE ADX General'), ZA: L('JSE:J203', 'FTSE/JSE All Share'),
  CZ: L('PSE:PX', 'PX'),
};

/** TradingView's page for a symbol ("EXCH:SYM" -> /symbols/EXCH-SYM/). */
export const tvUrl = (symbol: string) => `https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/`;
