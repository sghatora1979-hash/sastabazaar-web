// Stock listings for Quasar demo — three regions: India (NSE), USA, Europe.
// Prices come from /api/stocks (Yahoo Finance chart API, daily data).
// NOTE: Stooq was unreachable from the build environment (all endpoints timed
// out), so the route uses Yahoo Finance, which was verified live for every
// symbol below. No data is faked — symbols that failed validation were dropped:
//   - TATAMOTORS.NS (delisted after Tata Motors demerger)
//   - SQ (Block Inc. renamed ticker to XYZ)
//   - NESN.SW (no data returned)

export type StockRegion = 'india' | 'usa' | 'canada' | 'uk' | 'europe' | 'russia' | 'china' | 'hongkong' | 'singapore' | 'malaysia' | 'thailand' | 'japan';

export type Stock = {
  symbol: string; // display ticker, e.g. 'RELIANCE'
  yahoo: string; // Yahoo Finance symbol, e.g. 'RELIANCE.NS'
  name: string; // 'Reliance Industries'
  region: StockRegion;
  exchange: string; // 'NSE' | 'NASDAQ' | 'NYSE' | 'EURONEXT' | 'XETR' | 'EPA' | 'LSE' | 'OMXCOP' | 'SIX'
  tv: string; // TradingView symbol, e.g. 'NSE:RELIANCE'
  currency: string; // 'INR' | 'USD' | 'EUR' | 'CHF' | 'DKK' | 'GBp'
  decimals: number;
};

export const REGION_LABELS: Record<StockRegion, string> = {
  india: 'India',
  usa: 'USA',
  canada: 'Canada',
  uk: 'UK',
  europe: 'Europe',
  russia: 'Russia',
  china: 'China',
  hongkong: 'Hong Kong',
  singapore: 'Singapore',
  malaysia: 'Malaysia',
  thailand: 'Thailand',
  japan: 'Japan',
};

export const STOCKS: Stock[] = [
  // ---------------- India (NSE, INR) — 19 ----------------
  { symbol: 'RELIANCE', yahoo: 'RELIANCE.NS', name: 'Reliance Industries', region: 'india', exchange: 'NSE', tv: 'NSE:RELIANCE', currency: 'INR', decimals: 2 },
  { symbol: 'TCS', yahoo: 'TCS.NS', name: 'Tata Consultancy Services', region: 'india', exchange: 'NSE', tv: 'NSE:TCS', currency: 'INR', decimals: 2 },
  { symbol: 'INFY', yahoo: 'INFY.NS', name: 'Infosys', region: 'india', exchange: 'NSE', tv: 'NSE:INFY', currency: 'INR', decimals: 2 },
  { symbol: 'HDFCBANK', yahoo: 'HDFCBANK.NS', name: 'HDFC Bank', region: 'india', exchange: 'NSE', tv: 'NSE:HDFCBANK', currency: 'INR', decimals: 2 },
  { symbol: 'ICICIBANK', yahoo: 'ICICIBANK.NS', name: 'ICICI Bank', region: 'india', exchange: 'NSE', tv: 'NSE:ICICIBANK', currency: 'INR', decimals: 2 },
  { symbol: 'SBIN', yahoo: 'SBIN.NS', name: 'State Bank of India', region: 'india', exchange: 'NSE', tv: 'NSE:SBIN', currency: 'INR', decimals: 2 },
  { symbol: 'BHARTIARTL', yahoo: 'BHARTIARTL.NS', name: 'Bharti Airtel', region: 'india', exchange: 'NSE', tv: 'NSE:BHARTIARTL', currency: 'INR', decimals: 2 },
  { symbol: 'ITC', yahoo: 'ITC.NS', name: 'ITC Ltd', region: 'india', exchange: 'NSE', tv: 'NSE:ITC', currency: 'INR', decimals: 2 },
  { symbol: 'LT', yahoo: 'LT.NS', name: 'Larsen & Toubro', region: 'india', exchange: 'NSE', tv: 'NSE:LT', currency: 'INR', decimals: 2 },
  { symbol: 'KOTAKBANK', yahoo: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', region: 'india', exchange: 'NSE', tv: 'NSE:KOTAKBANK', currency: 'INR', decimals: 2 },
  { symbol: 'AXISBANK', yahoo: 'AXISBANK.NS', name: 'Axis Bank', region: 'india', exchange: 'NSE', tv: 'NSE:AXISBANK', currency: 'INR', decimals: 2 },
  { symbol: 'MARUTI', yahoo: 'MARUTI.NS', name: 'Maruti Suzuki', region: 'india', exchange: 'NSE', tv: 'NSE:MARUTI', currency: 'INR', decimals: 2 },
  { symbol: 'TITAN', yahoo: 'TITAN.NS', name: 'Titan Company', region: 'india', exchange: 'NSE', tv: 'NSE:TITAN', currency: 'INR', decimals: 2 },
  { symbol: 'SUNPHARMA', yahoo: 'SUNPHARMA.NS', name: 'Sun Pharma', region: 'india', exchange: 'NSE', tv: 'NSE:SUNPHARMA', currency: 'INR', decimals: 2 },
  { symbol: 'WIPRO', yahoo: 'WIPRO.NS', name: 'Wipro', region: 'india', exchange: 'NSE', tv: 'NSE:WIPRO', currency: 'INR', decimals: 2 },
  { symbol: 'HCLTECH', yahoo: 'HCLTECH.NS', name: 'HCLTech', region: 'india', exchange: 'NSE', tv: 'NSE:HCLTECH', currency: 'INR', decimals: 2 },
  { symbol: 'ADANIENT', yahoo: 'ADANIENT.NS', name: 'Adani Enterprises', region: 'india', exchange: 'NSE', tv: 'NSE:ADANIENT', currency: 'INR', decimals: 2 },
  { symbol: 'POWERGRID', yahoo: 'POWERGRID.NS', name: 'Power Grid Corp', region: 'india', exchange: 'NSE', tv: 'NSE:POWERGRID', currency: 'INR', decimals: 2 },
  { symbol: 'NTPC', yahoo: 'NTPC.NS', name: 'NTPC Ltd', region: 'india', exchange: 'NSE', tv: 'NSE:NTPC', currency: 'INR', decimals: 2 },
  // ---------------- USA (USD) — 30 ----------------
  { symbol: 'AAPL', yahoo: 'AAPL', name: 'Apple', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:AAPL', currency: 'USD', decimals: 2 },
  { symbol: 'MSFT', yahoo: 'MSFT', name: 'Microsoft', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:MSFT', currency: 'USD', decimals: 2 },
  { symbol: 'NVDA', yahoo: 'NVDA', name: 'NVIDIA', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:NVDA', currency: 'USD', decimals: 2 },
  { symbol: 'TSLA', yahoo: 'TSLA', name: 'Tesla', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:TSLA', currency: 'USD', decimals: 2 },
  { symbol: 'AMZN', yahoo: 'AMZN', name: 'Amazon', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:AMZN', currency: 'USD', decimals: 2 },
  { symbol: 'GOOGL', yahoo: 'GOOGL', name: 'Alphabet', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:GOOGL', currency: 'USD', decimals: 2 },
  { symbol: 'META', yahoo: 'META', name: 'Meta Platforms', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:META', currency: 'USD', decimals: 2 },
  { symbol: 'NFLX', yahoo: 'NFLX', name: 'Netflix', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:NFLX', currency: 'USD', decimals: 2 },
  { symbol: 'AMD', yahoo: 'AMD', name: 'AMD', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:AMD', currency: 'USD', decimals: 2 },
  { symbol: 'INTC', yahoo: 'INTC', name: 'Intel', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:INTC', currency: 'USD', decimals: 2 },
  { symbol: 'JPM', yahoo: 'JPM', name: 'JPMorgan Chase', region: 'usa', exchange: 'NYSE', tv: 'NYSE:JPM', currency: 'USD', decimals: 2 },
  { symbol: 'V', yahoo: 'V', name: 'Visa', region: 'usa', exchange: 'NYSE', tv: 'NYSE:V', currency: 'USD', decimals: 2 },
  { symbol: 'JNJ', yahoo: 'JNJ', name: 'Johnson & Johnson', region: 'usa', exchange: 'NYSE', tv: 'NYSE:JNJ', currency: 'USD', decimals: 2 },
  { symbol: 'WMT', yahoo: 'WMT', name: 'Walmart', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:WMT', currency: 'USD', decimals: 2 },
  { symbol: 'DIS', yahoo: 'DIS', name: 'Disney', region: 'usa', exchange: 'NYSE', tv: 'NYSE:DIS', currency: 'USD', decimals: 2 },
  { symbol: 'PYPL', yahoo: 'PYPL', name: 'PayPal', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:PYPL', currency: 'USD', decimals: 2 },
  { symbol: 'COIN', yahoo: 'COIN', name: 'Coinbase', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:COIN', currency: 'USD', decimals: 2 },
  { symbol: 'MSTR', yahoo: 'MSTR', name: 'Strategy', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:MSTR', currency: 'USD', decimals: 2 },
  { symbol: 'PLTR', yahoo: 'PLTR', name: 'Palantir', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:PLTR', currency: 'USD', decimals: 2 },
  { symbol: 'XYZ', yahoo: 'XYZ', name: 'Block Inc', region: 'usa', exchange: 'NYSE', tv: 'NYSE:XYZ', currency: 'USD', decimals: 2 },
  { symbol: 'BAC', yahoo: 'BAC', name: 'Bank of America', region: 'usa', exchange: 'NYSE', tv: 'NYSE:BAC', currency: 'USD', decimals: 2 },
  { symbol: 'XOM', yahoo: 'XOM', name: 'Exxon Mobil', region: 'usa', exchange: 'NYSE', tv: 'NYSE:XOM', currency: 'USD', decimals: 2 },
  { symbol: 'KO', yahoo: 'KO', name: 'Coca-Cola', region: 'usa', exchange: 'NYSE', tv: 'NYSE:KO', currency: 'USD', decimals: 2 },
  { symbol: 'PFE', yahoo: 'PFE', name: 'Pfizer', region: 'usa', exchange: 'NYSE', tv: 'NYSE:PFE', currency: 'USD', decimals: 2 },
  { symbol: 'ABBV', yahoo: 'ABBV', name: 'AbbVie', region: 'usa', exchange: 'NYSE', tv: 'NYSE:ABBV', currency: 'USD', decimals: 2 },
  { symbol: 'CRM', yahoo: 'CRM', name: 'Salesforce', region: 'usa', exchange: 'NYSE', tv: 'NYSE:CRM', currency: 'USD', decimals: 2 },
  { symbol: 'ORCL', yahoo: 'ORCL', name: 'Oracle', region: 'usa', exchange: 'NYSE', tv: 'NYSE:ORCL', currency: 'USD', decimals: 2 },
  { symbol: 'ADBE', yahoo: 'ADBE', name: 'Adobe', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:ADBE', currency: 'USD', decimals: 2 },
  { symbol: 'NKE', yahoo: 'NKE', name: 'Nike', region: 'usa', exchange: 'NYSE', tv: 'NYSE:NKE', currency: 'USD', decimals: 2 },
  { symbol: 'AVGO', yahoo: 'AVGO', name: 'Broadcom', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:AVGO', currency: 'USD', decimals: 2 },
  // ---------------- Europe — 13 ----------------
  { symbol: 'ASML', yahoo: 'ASML.AS', name: 'ASML Holding', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:ASML', currency: 'EUR', decimals: 2 },
  { symbol: 'SAP', yahoo: 'SAP.DE', name: 'SAP', region: 'europe', exchange: 'XETR', tv: 'XETR:SAP', currency: 'EUR', decimals: 2 },
  { symbol: 'MC', yahoo: 'MC.PA', name: 'LVMH', region: 'europe', exchange: 'EPA', tv: 'EPA:MC', currency: 'EUR', decimals: 2 },
  { symbol: 'TTE', yahoo: 'TTE.PA', name: 'TotalEnergies', region: 'europe', exchange: 'EPA', tv: 'EPA:TTE', currency: 'EUR', decimals: 2 },
  { symbol: 'SIE', yahoo: 'SIE.DE', name: 'Siemens', region: 'europe', exchange: 'XETR', tv: 'XETR:SIE', currency: 'EUR', decimals: 2 },
  { symbol: 'ALV', yahoo: 'ALV.DE', name: 'Allianz', region: 'europe', exchange: 'XETR', tv: 'XETR:ALV', currency: 'EUR', decimals: 2 },
  { symbol: 'OR', yahoo: 'OR.PA', name: "L'Oréal", region: 'europe', exchange: 'EPA', tv: 'EPA:OR', currency: 'EUR', decimals: 2 },
  { symbol: 'AIR', yahoo: 'AIR.PA', name: 'Airbus', region: 'europe', exchange: 'EPA', tv: 'EPA:AIR', currency: 'EUR', decimals: 2 },
  { symbol: 'SAN', yahoo: 'SAN.PA', name: 'Sanofi', region: 'europe', exchange: 'EPA', tv: 'EPA:SAN', currency: 'EUR', decimals: 2 },
  { symbol: 'SHEL', yahoo: 'SHEL.L', name: 'Shell', region: 'europe', exchange: 'LSE', tv: 'LSE:SHEL', currency: 'GBp', decimals: 0 },
  { symbol: 'BP', yahoo: 'BP.L', name: 'BP', region: 'europe', exchange: 'LSE', tv: 'LSE:BP', currency: 'GBp', decimals: 0 },
  { symbol: 'NOVO-B', yahoo: 'NOVO-B.CO', name: 'Novo Nordisk', region: 'europe', exchange: 'OMXCOP', tv: 'OMXCOP:NOVO-B', currency: 'DKK', decimals: 2 },
  { symbol: 'RO', yahoo: 'RO.SW', name: 'Roche', region: 'europe', exchange: 'SIX', tv: 'SIX:RO', currency: 'CHF', decimals: 2 },
  // ---------------- INDIA (19) ----------------
  { symbol: 'ULTRACEMCO', yahoo: 'ULTRACEMCO.NS', name: 'UltraTech Cement', region: 'india', exchange: 'NSE', tv: 'NSE:ULTRACEMCO', currency: 'INR', decimals: 2 },
  { symbol: 'BAJFINANCE', yahoo: 'BAJFINANCE.NS', name: 'Bajaj Finance', region: 'india', exchange: 'NSE', tv: 'NSE:BAJFINANCE', currency: 'INR', decimals: 2 },
  { symbol: 'TATAPOWER', yahoo: 'TATAPOWER.NS', name: 'Tata Power', region: 'india', exchange: 'NSE', tv: 'NSE:TATAPOWER', currency: 'INR', decimals: 2 },
  { symbol: 'ONGC', yahoo: 'ONGC.NS', name: 'ONGC', region: 'india', exchange: 'NSE', tv: 'NSE:ONGC', currency: 'INR', decimals: 2 },
  { symbol: 'COALINDIA', yahoo: 'COALINDIA.NS', name: 'Coal India', region: 'india', exchange: 'NSE', tv: 'NSE:COALINDIA', currency: 'INR', decimals: 2 },
  { symbol: 'DIVISLAB', yahoo: 'DIVISLAB.NS', name: 'Divi\'s Labs', region: 'india', exchange: 'NSE', tv: 'NSE:DIVISLAB', currency: 'INR', decimals: 2 },
  { symbol: 'EICHERMOT', yahoo: 'EICHERMOT.NS', name: 'Eicher Motors', region: 'india', exchange: 'NSE', tv: 'NSE:EICHERMOT', currency: 'INR', decimals: 2 },
  { symbol: 'HINDALCO', yahoo: 'HINDALCO.NS', name: 'Hindalco', region: 'india', exchange: 'NSE', tv: 'NSE:HINDALCO', currency: 'INR', decimals: 2 },
  { symbol: 'JSWSTEEL', yahoo: 'JSWSTEEL.NS', name: 'JSW Steel', region: 'india', exchange: 'NSE', tv: 'NSE:JSWSTEEL', currency: 'INR', decimals: 2 },
  { symbol: 'TATASTEEL', yahoo: 'TATASTEEL.NS', name: 'Tata Steel', region: 'india', exchange: 'NSE', tv: 'NSE:TATASTEEL', currency: 'INR', decimals: 2 },
  { symbol: 'TECHM', yahoo: 'TECHM.NS', name: 'Tech Mahindra', region: 'india', exchange: 'NSE', tv: 'NSE:TECHM', currency: 'INR', decimals: 2 },
  { symbol: 'PIDILITIND', yahoo: 'PIDILITIND.NS', name: 'Pidilite', region: 'india', exchange: 'NSE', tv: 'NSE:PIDILITIND', currency: 'INR', decimals: 2 },
  { symbol: 'DABUR', yahoo: 'DABUR.NS', name: 'Dabur India', region: 'india', exchange: 'NSE', tv: 'NSE:DABUR', currency: 'INR', decimals: 2 },
  { symbol: 'BRITANNIA', yahoo: 'BRITANNIA.NS', name: 'Britannia', region: 'india', exchange: 'NSE', tv: 'NSE:BRITANNIA', currency: 'INR', decimals: 2 },
  { symbol: 'HAVELLS', yahoo: 'HAVELLS.NS', name: 'Havells India', region: 'india', exchange: 'NSE', tv: 'NSE:HAVELLS', currency: 'INR', decimals: 2 },
  { symbol: 'DLF', yahoo: 'DLF.NS', name: 'DLF Ltd', region: 'india', exchange: 'NSE', tv: 'NSE:DLF', currency: 'INR', decimals: 2 },
  { symbol: 'APOLLOHOSP', yahoo: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', region: 'india', exchange: 'NSE', tv: 'NSE:APOLLOHOSP', currency: 'INR', decimals: 2 },
  { symbol: 'VEDL', yahoo: 'VEDL.NS', name: 'Vedanta', region: 'india', exchange: 'NSE', tv: 'NSE:VEDL', currency: 'INR', decimals: 2 },
  { symbol: 'IOC', yahoo: 'IOC.NS', name: 'Indian Oil Corp', region: 'india', exchange: 'NSE', tv: 'NSE:IOC', currency: 'INR', decimals: 2 },
  // ---------------- CANADA (15) ----------------
  { symbol: 'SHOP', yahoo: 'SHOP.TO', name: 'Shopify', region: 'canada', exchange: 'TSX', tv: 'TSX:SHOP', currency: 'CAD', decimals: 2 },
  { symbol: 'RY', yahoo: 'RY.TO', name: 'Royal Bank of Canada', region: 'canada', exchange: 'TSX', tv: 'TSX:RY', currency: 'CAD', decimals: 2 },
  { symbol: 'TD', yahoo: 'TD.TO', name: 'TD Bank', region: 'canada', exchange: 'TSX', tv: 'TSX:TD', currency: 'CAD', decimals: 2 },
  { symbol: 'ENB', yahoo: 'ENB.TO', name: 'Enbridge', region: 'canada', exchange: 'TSX', tv: 'TSX:ENB', currency: 'CAD', decimals: 2 },
  { symbol: 'CNR', yahoo: 'CNR.TO', name: 'CN Railway', region: 'canada', exchange: 'TSX', tv: 'TSX:CNR', currency: 'CAD', decimals: 2 },
  { symbol: 'CP', yahoo: 'CP.TO', name: 'CPKC Railway', region: 'canada', exchange: 'TSX', tv: 'TSX:CP', currency: 'CAD', decimals: 2 },
  { symbol: 'BAM', yahoo: 'BAM.TO', name: 'Brookfield Corp', region: 'canada', exchange: 'TSX', tv: 'TSX:BAM', currency: 'CAD', decimals: 2 },
  { symbol: 'BNS', yahoo: 'BNS.TO', name: 'Scotiabank', region: 'canada', exchange: 'TSX', tv: 'TSX:BNS', currency: 'CAD', decimals: 2 },
  { symbol: 'BMO', yahoo: 'BMO.TO', name: 'Bank of Montreal', region: 'canada', exchange: 'TSX', tv: 'TSX:BMO', currency: 'CAD', decimals: 2 },
  { symbol: 'TRP', yahoo: 'TRP.TO', name: 'TC Energy', region: 'canada', exchange: 'TSX', tv: 'TSX:TRP', currency: 'CAD', decimals: 2 },
  { symbol: 'BCE', yahoo: 'BCE.TO', name: 'BCE Inc', region: 'canada', exchange: 'TSX', tv: 'TSX:BCE', currency: 'CAD', decimals: 2 },
  { symbol: 'SU', yahoo: 'SU.TO', name: 'Suncor Energy', region: 'canada', exchange: 'TSX', tv: 'TSX:SU', currency: 'CAD', decimals: 2 },
  { symbol: 'CNQ', yahoo: 'CNQ.TO', name: 'Canadian Natural', region: 'canada', exchange: 'TSX', tv: 'TSX:CNQ', currency: 'CAD', decimals: 2 },
  { symbol: 'AEM', yahoo: 'AEM.TO', name: 'Agnico Eagle', region: 'canada', exchange: 'TSX', tv: 'TSX:AEM', currency: 'CAD', decimals: 2 },
  { symbol: 'ATD', yahoo: 'ATD.TO', name: 'Alimentation Couche-Tard', region: 'canada', exchange: 'TSX', tv: 'TSX:ATD', currency: 'CAD', decimals: 2 },
  // ---------------- UK (10) ----------------
  { symbol: 'SHEL', yahoo: 'SHEL.L', name: 'Shell', region: 'uk', exchange: 'LSE', tv: 'LSE:SHEL', currency: 'GBp', decimals: 2 },
  { symbol: 'AZN', yahoo: 'AZN.L', name: 'AstraZeneca', region: 'uk', exchange: 'LSE', tv: 'LSE:AZN', currency: 'GBp', decimals: 2 },
  { symbol: 'HSBA', yahoo: 'HSBA.L', name: 'HSBC', region: 'uk', exchange: 'LSE', tv: 'LSE:HSBA', currency: 'GBp', decimals: 2 },
  { symbol: 'ULVR', yahoo: 'ULVR.L', name: 'Unilever', region: 'uk', exchange: 'LSE', tv: 'LSE:ULVR', currency: 'GBp', decimals: 2 },
  { symbol: 'BP', yahoo: 'BP.L', name: 'BP', region: 'uk', exchange: 'LSE', tv: 'LSE:BP', currency: 'GBp', decimals: 2 },
  { symbol: 'GSK', yahoo: 'GSK.L', name: 'GSK', region: 'uk', exchange: 'LSE', tv: 'LSE:GSK', currency: 'GBp', decimals: 2 },
  { symbol: 'RIO', yahoo: 'RIO.L', name: 'Rio Tinto', region: 'uk', exchange: 'LSE', tv: 'LSE:RIO', currency: 'GBp', decimals: 2 },
  { symbol: 'DGE', yahoo: 'DGE.L', name: 'Diageo', region: 'uk', exchange: 'LSE', tv: 'LSE:DGE', currency: 'GBp', decimals: 2 },
  { symbol: 'VOD', yahoo: 'VOD.L', name: 'Vodafone', region: 'uk', exchange: 'LSE', tv: 'LSE:VOD', currency: 'GBp', decimals: 2 },
  { symbol: 'BARC', yahoo: 'BARC.L', name: 'Barclays', region: 'uk', exchange: 'LSE', tv: 'LSE:BARC', currency: 'GBp', decimals: 2 },
  // ---------------- EUROPE (22) ----------------
  { symbol: 'SAP', yahoo: 'SAP.DE', name: 'SAP', region: 'europe', exchange: 'XETRA', tv: 'XETRA:SAP', currency: 'EUR', decimals: 2 },
  { symbol: 'SIE', yahoo: 'SIE.DE', name: 'Siemens', region: 'europe', exchange: 'XETRA', tv: 'XETRA:SIE', currency: 'EUR', decimals: 2 },
  { symbol: 'ALV', yahoo: 'ALV.DE', name: 'Allianz', region: 'europe', exchange: 'XETRA', tv: 'XETRA:ALV', currency: 'EUR', decimals: 2 },
  { symbol: 'DTE', yahoo: 'DTE.DE', name: 'Deutsche Telekom', region: 'europe', exchange: 'XETRA', tv: 'XETRA:DTE', currency: 'EUR', decimals: 2 },
  { symbol: 'MBG', yahoo: 'MBG.DE', name: 'Mercedes-Benz', region: 'europe', exchange: 'XETRA', tv: 'XETRA:MBG', currency: 'EUR', decimals: 2 },
  { symbol: 'BMW', yahoo: 'BMW.DE', name: 'BMW', region: 'europe', exchange: 'XETRA', tv: 'XETRA:BMW', currency: 'EUR', decimals: 2 },
  { symbol: 'VOW', yahoo: 'VOW.DE', name: 'Volkswagen', region: 'europe', exchange: 'XETRA', tv: 'XETRA:VOW', currency: 'EUR', decimals: 2 },
  { symbol: 'BAS', yahoo: 'BAS.DE', name: 'BASF', region: 'europe', exchange: 'XETRA', tv: 'XETRA:BAS', currency: 'EUR', decimals: 2 },
  { symbol: 'DBK', yahoo: 'DBK.DE', name: 'Deutsche Bank', region: 'europe', exchange: 'XETRA', tv: 'XETRA:DBK', currency: 'EUR', decimals: 2 },
  { symbol: 'MUV2', yahoo: 'MUV2.DE', name: 'Munich Re', region: 'europe', exchange: 'XETRA', tv: 'XETRA:MUV2', currency: 'EUR', decimals: 2 },
  { symbol: 'MC', yahoo: 'MC.PA', name: 'LVMH', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:MC', currency: 'EUR', decimals: 2 },
  { symbol: 'OR', yahoo: 'OR.PA', name: 'L\'Oreal', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:OR', currency: 'EUR', decimals: 2 },
  { symbol: 'TTE', yahoo: 'TTE.PA', name: 'TotalEnergies', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:TTE', currency: 'EUR', decimals: 2 },
  { symbol: 'SAN', yahoo: 'SAN.PA', name: 'Sanofi', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:SAN', currency: 'EUR', decimals: 2 },
  { symbol: 'AI', yahoo: 'AI.PA', name: 'Air Liquide', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:AI', currency: 'EUR', decimals: 2 },
  { symbol: 'BNP', yahoo: 'BNP.PA', name: 'BNP Paribas', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:BNP', currency: 'EUR', decimals: 2 },
  { symbol: 'ASML', yahoo: 'ASML.AS', name: 'ASML', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:ASML', currency: 'EUR', decimals: 2 },
  { symbol: 'PRX', yahoo: 'PRX.AS', name: 'Prosus', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:PRX', currency: 'EUR', decimals: 2 },
  { symbol: 'INGA', yahoo: 'INGA.AS', name: 'ING Group', region: 'europe', exchange: 'EURONEXT', tv: 'EURONEXT:INGA', currency: 'EUR', decimals: 2 },
  { symbol: 'NOVN', yahoo: 'NOVN.SW', name: 'Novartis', region: 'europe', exchange: 'SIX', tv: 'SIX:NOVN', currency: 'CHF', decimals: 2 },
  { symbol: 'UBSG', yahoo: 'UBSG.SW', name: 'UBS', region: 'europe', exchange: 'SIX', tv: 'SIX:UBSG', currency: 'CHF', decimals: 2 },
  { symbol: 'ABBN', yahoo: 'ABBN.SW', name: 'ABB', region: 'europe', exchange: 'SIX', tv: 'SIX:ABBN', currency: 'CHF', decimals: 2 },
  // ---------------- HONGKONG (10) ----------------
  { symbol: '0700', yahoo: '0700.HK', name: 'Tencent', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:0700', currency: 'HKD', decimals: 2 },
  { symbol: '9988', yahoo: '9988.HK', name: 'Alibaba', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:9988', currency: 'HKD', decimals: 2 },
  { symbol: '0941', yahoo: '0941.HK', name: 'China Mobile', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:0941', currency: 'HKD', decimals: 2 },
  { symbol: '1299', yahoo: '1299.HK', name: 'AIA Group', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:1299', currency: 'HKD', decimals: 2 },
  { symbol: '2318', yahoo: '2318.HK', name: 'Ping An Insurance', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:2318', currency: 'HKD', decimals: 2 },
  { symbol: '0005', yahoo: '0005.HK', name: 'HSBC Holdings', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:0005', currency: 'HKD', decimals: 2 },
  { symbol: '0883', yahoo: '0883.HK', name: 'CNOOC', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:0883', currency: 'HKD', decimals: 2 },
  { symbol: '3690', yahoo: '3690.HK', name: 'Meituan', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:3690', currency: 'HKD', decimals: 2 },
  { symbol: '1810', yahoo: '1810.HK', name: 'Xiaomi', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:1810', currency: 'HKD', decimals: 2 },
  { symbol: '2020', yahoo: '2020.HK', name: 'Anta Sports', region: 'hongkong', exchange: 'HKEX', tv: 'HKEX:2020', currency: 'HKD', decimals: 2 },
  // ---------------- CHINA (8) ----------------
  { symbol: '600519', yahoo: '600519.SS', name: 'Kweichow Moutai', region: 'china', exchange: 'SSE', tv: 'SSE:600519', currency: 'CNY', decimals: 2 },
  { symbol: '601318', yahoo: '601318.SS', name: 'Ping An Insurance', region: 'china', exchange: 'SSE', tv: 'SSE:601318', currency: 'CNY', decimals: 2 },
  { symbol: '600036', yahoo: '600036.SS', name: 'China Merchants Bank', region: 'china', exchange: 'SSE', tv: 'SSE:600036', currency: 'CNY', decimals: 2 },
  { symbol: '300750', yahoo: '300750.SZ', name: 'CATL', region: 'china', exchange: 'SZSE', tv: 'SZSE:300750', currency: 'CNY', decimals: 2 },
  { symbol: '002594', yahoo: '002594.SZ', name: 'BYD', region: 'china', exchange: 'SZSE', tv: 'SZSE:002594', currency: 'CNY', decimals: 2 },
  { symbol: '000858', yahoo: '000858.SZ', name: 'Wuliangye', region: 'china', exchange: 'SZSE', tv: 'SZSE:000858', currency: 'CNY', decimals: 2 },
  { symbol: '601888', yahoo: '601888.SS', name: 'China Tourism Group', region: 'china', exchange: 'SSE', tv: 'SSE:601888', currency: 'CNY', decimals: 2 },
  { symbol: '000001', yahoo: '000001.SZ', name: 'Ping An Bank', region: 'china', exchange: 'SZSE', tv: 'SZSE:000001', currency: 'CNY', decimals: 2 },
  // ---------------- SINGAPORE (6) ----------------
  { symbol: 'D05', yahoo: 'D05.SI', name: 'DBS Group', region: 'singapore', exchange: 'SGX', tv: 'SGX:D05', currency: 'SGD', decimals: 2 },
  { symbol: 'U11', yahoo: 'U11.SI', name: 'UOB', region: 'singapore', exchange: 'SGX', tv: 'SGX:U11', currency: 'SGD', decimals: 2 },
  { symbol: 'O39', yahoo: 'O39.SI', name: 'OCBC Bank', region: 'singapore', exchange: 'SGX', tv: 'SGX:O39', currency: 'SGD', decimals: 2 },
  { symbol: 'Z74', yahoo: 'Z74.SI', name: 'Singtel', region: 'singapore', exchange: 'SGX', tv: 'SGX:Z74', currency: 'SGD', decimals: 2 },
  { symbol: 'S68', yahoo: 'S68.SI', name: 'SGX', region: 'singapore', exchange: 'SGX', tv: 'SGX:S68', currency: 'SGD', decimals: 2 },
  { symbol: 'F34', yahoo: 'F34.SI', name: 'Wilmar Intl', region: 'singapore', exchange: 'SGX', tv: 'SGX:F34', currency: 'SGD', decimals: 2 },
  // ---------------- MALAYSIA (5) ----------------
  { symbol: '1155', yahoo: '1155.KL', name: 'Maybank', region: 'malaysia', exchange: 'BURSA', tv: 'MYX:1155', currency: 'MYR', decimals: 2 },
  { symbol: '1023', yahoo: '1023.KL', name: 'CIMB Group', region: 'malaysia', exchange: 'BURSA', tv: 'MYX:1023', currency: 'MYR', decimals: 2 },
  { symbol: '1295', yahoo: '1295.KL', name: 'Public Bank', region: 'malaysia', exchange: 'BURSA', tv: 'MYX:1295', currency: 'MYR', decimals: 2 },
  { symbol: '5347', yahoo: '5347.KL', name: 'Tenaga Nasional', region: 'malaysia', exchange: 'BURSA', tv: 'MYX:5347', currency: 'MYR', decimals: 2 },
  { symbol: '5225', yahoo: '5225.KL', name: 'IHH Healthcare', region: 'malaysia', exchange: 'BURSA', tv: 'MYX:5225', currency: 'MYR', decimals: 2 },
  // ---------------- THAILAND (5) ----------------
  { symbol: 'PTT', yahoo: 'PTT.BK', name: 'PTT PCL', region: 'thailand', exchange: 'SET', tv: 'SET:PTT', currency: 'THB', decimals: 2 },
  { symbol: 'ADVANC', yahoo: 'ADVANC.BK', name: 'Advanced Info', region: 'thailand', exchange: 'SET', tv: 'SET:ADVANC', currency: 'THB', decimals: 2 },
  { symbol: 'AOT', yahoo: 'AOT.BK', name: 'Airports of Thailand', region: 'thailand', exchange: 'SET', tv: 'SET:AOT', currency: 'THB', decimals: 2 },
  { symbol: 'CPALL', yahoo: 'CPALL.BK', name: 'CP All', region: 'thailand', exchange: 'SET', tv: 'SET:CPALL', currency: 'THB', decimals: 2 },
  { symbol: 'KBANK', yahoo: 'KBANK.BK', name: 'Kasikornbank', region: 'thailand', exchange: 'SET', tv: 'SET:KBANK', currency: 'THB', decimals: 2 },
  // ---------------- RUSSIA (6) ----------------
  { symbol: 'GAZP', yahoo: 'GAZP.ME', name: 'Gazprom', region: 'russia', exchange: 'MOEX', tv: 'MOEX:GAZP', currency: 'RUB', decimals: 2 },
  { symbol: 'LKOH', yahoo: 'LKOH.ME', name: 'Lukoil', region: 'russia', exchange: 'MOEX', tv: 'MOEX:LKOH', currency: 'RUB', decimals: 2 },
  { symbol: 'SBER', yahoo: 'SBER.ME', name: 'Sberbank', region: 'russia', exchange: 'MOEX', tv: 'MOEX:SBER', currency: 'RUB', decimals: 2 },
  { symbol: 'ROSN', yahoo: 'ROSN.ME', name: 'Rosneft', region: 'russia', exchange: 'MOEX', tv: 'MOEX:ROSN', currency: 'RUB', decimals: 2 },
  { symbol: 'NVTK', yahoo: 'NVTK.ME', name: 'Novatek', region: 'russia', exchange: 'MOEX', tv: 'MOEX:NVTK', currency: 'RUB', decimals: 2 },
  { symbol: 'MGNT', yahoo: 'MGNT.ME', name: 'Magnit', region: 'russia', exchange: 'MOEX', tv: 'MOEX:MGNT', currency: 'RUB', decimals: 2 },
  // ---------------- JAPAN (7) ----------------
  { symbol: '7203', yahoo: '7203.T', name: 'Toyota', region: 'japan', exchange: 'TSE', tv: 'TSE:7203', currency: 'JPY', decimals: 0 },
  { symbol: '6758', yahoo: '6758.T', name: 'Sony', region: 'japan', exchange: 'TSE', tv: 'TSE:6758', currency: 'JPY', decimals: 0 },
  { symbol: '9984', yahoo: '9984.T', name: 'SoftBank Group', region: 'japan', exchange: 'TSE', tv: 'TSE:9984', currency: 'JPY', decimals: 0 },
  { symbol: '8306', yahoo: '8306.T', name: 'MUFG', region: 'japan', exchange: 'TSE', tv: 'TSE:8306', currency: 'JPY', decimals: 0 },
  { symbol: '8035', yahoo: '8035.T', name: 'Tokyo Electron', region: 'japan', exchange: 'TSE', tv: 'TSE:8035', currency: 'JPY', decimals: 0 },
  { symbol: '9983', yahoo: '9983.T', name: 'Fast Retailing', region: 'japan', exchange: 'TSE', tv: 'TSE:9983', currency: 'JPY', decimals: 0 },
  { symbol: '6861', yahoo: '6861.T', name: 'Keyence', region: 'japan', exchange: 'TSE', tv: 'TSE:6861', currency: 'JPY', decimals: 0 },
  // ---------------- USA (20) ----------------
  { symbol: 'ABBV', yahoo: 'ABBV', name: 'AbbVie', region: 'usa', exchange: 'NYSE', tv: 'NYSE:ABBV', currency: 'USD', decimals: 2 },
  { symbol: 'ACN', yahoo: 'ACN', name: 'Accenture', region: 'usa', exchange: 'NYSE', tv: 'NYSE:ACN', currency: 'USD', decimals: 2 },
  { symbol: 'ADBE', yahoo: 'ADBE', name: 'Adobe', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:ADBE', currency: 'USD', decimals: 2 },
  { symbol: 'AMGN', yahoo: 'AMGN', name: 'Amgen', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:AMGN', currency: 'USD', decimals: 2 },
  { symbol: 'GS', yahoo: 'GS', name: 'Goldman Sachs', region: 'usa', exchange: 'NYSE', tv: 'NYSE:GS', currency: 'USD', decimals: 2 },
  { symbol: 'MS', yahoo: 'MS', name: 'Morgan Stanley', region: 'usa', exchange: 'NYSE', tv: 'NYSE:MS', currency: 'USD', decimals: 2 },
  { symbol: 'CAT', yahoo: 'CAT', name: 'Caterpillar', region: 'usa', exchange: 'NYSE', tv: 'NYSE:CAT', currency: 'USD', decimals: 2 },
  { symbol: 'HON', yahoo: 'HON', name: 'Honeywell', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:HON', currency: 'USD', decimals: 2 },
  { symbol: 'UNP', yahoo: 'UNP', name: 'Union Pacific', region: 'usa', exchange: 'NYSE', tv: 'NYSE:UNP', currency: 'USD', decimals: 2 },
  { symbol: 'LOW', yahoo: 'LOW', name: 'Lowe\'s', region: 'usa', exchange: 'NYSE', tv: 'NYSE:LOW', currency: 'USD', decimals: 2 },
  { symbol: 'SPGI', yahoo: 'SPGI', name: 'S&P Global', region: 'usa', exchange: 'NYSE', tv: 'NYSE:SPGI', currency: 'USD', decimals: 2 },
  { symbol: 'BLK', yahoo: 'BLK', name: 'BlackRock', region: 'usa', exchange: 'NYSE', tv: 'NYSE:BLK', currency: 'USD', decimals: 2 },
  { symbol: 'AXP', yahoo: 'AXP', name: 'American Express', region: 'usa', exchange: 'NYSE', tv: 'NYSE:AXP', currency: 'USD', decimals: 2 },
  { symbol: 'GE', yahoo: 'GE', name: 'GE Aerospace', region: 'usa', exchange: 'NYSE', tv: 'NYSE:GE', currency: 'USD', decimals: 2 },
  { symbol: 'UBER', yahoo: 'UBER', name: 'Uber', region: 'usa', exchange: 'NYSE', tv: 'NYSE:UBER', currency: 'USD', decimals: 2 },
  { symbol: 'ABNB', yahoo: 'ABNB', name: 'Airbnb', region: 'usa', exchange: 'NASDAQ', tv: 'NASDAQ:ABNB', currency: 'USD', decimals: 2 },
  { symbol: 'SHOP', yahoo: 'SHOP', name: 'Shopify (US)', region: 'usa', exchange: 'NYSE', tv: 'NYSE:SHOP', currency: 'USD', decimals: 2 },
  { symbol: 'SONY', yahoo: 'SONY', name: 'Sony Group', region: 'usa', exchange: 'NYSE', tv: 'NYSE:SONY', currency: 'USD', decimals: 2 },
  { symbol: 'TM', yahoo: 'TM', name: 'Toyota Motor', region: 'usa', exchange: 'NYSE', tv: 'NYSE:TM', currency: 'USD', decimals: 2 },
  { symbol: 'BABA', yahoo: 'BABA', name: 'Alibaba', region: 'usa', exchange: 'NYSE', tv: 'NYSE:BABA', currency: 'USD', decimals: 2 },
];

export const stockBySymbol = (s: string): Stock | undefined =>
  STOCKS.find((st) => st.symbol === s.toUpperCase());

export const stocksByRegion = (region: StockRegion): Stock[] =>
  STOCKS.filter((st) => st.region === region);

/** Format a stock price in its native currency. */
export function fmtStockPrice(n: number, currency: string, decimals = 2): string {
  if (!(n > 0)) return '—';
  const body = n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  switch (currency) {
    case 'INR':
      return `₹${body}`;
    case 'EUR':
      return `€${body}`;
    case 'CHF':
      return `CHF ${body}`;
    case 'DKK':
      return `${body} kr`;
    case 'GBp':
      return `${body}p`;
    default:
      return `$${body}`;
  }
}

/** Compact volume, e.g. 12.4M. */
export function fmtVol(n: number): string {
  if (!(n > 0)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}
