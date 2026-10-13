'use client';

import Script from 'next/script';

// Shared free TradingView embeds (tradingview.com iframes/scripts — no API key).
// Each widget loads its own script URL once per page via a stable Script id.

function WidgetShell({
  id,
  src,
  config,
  height,
  label,
}: {
  id: string;
  src: string;
  config: Record<string, unknown>;
  height: number | string;
  label: string;
}) {
  return (
    <div className="tradingview-widget-container rounded-2xl overflow-hidden border border-edge bg-panel" style={{ height }}>
      <div className="tradingview-widget-container__widget h-full" aria-label={label} />
      <Script id={id} src={src} strategy="lazyOnload">
        {JSON.stringify(config)}
      </Script>
    </div>
  );
}

const TAPE_SYMBOLS = [
  'BTCUSD',
  'ETHUSD',
  'SOLUSD',
  'XRPUSD',
  'DOGEUSD',
  'ADAUSD',
  'AVAXUSD',
  'LINKUSD',
  'DOTUSD',
  'MATICUSD',
].map((s) => ({ proName: `KRAKEN:${s}`, title: s.replace('USD', '') }));

/** Scrolling crypto price tape — place at the top of the markets page. */
export function TVTickerTape() {
  return (
    <WidgetShell
      id="tv-ticker-tape"
      src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
      height={46}
      label="Live crypto price ticker"
      config={{
        symbols: TAPE_SYMBOLS,
        showSymbolLogo: true,
        colorTheme: 'dark',
        isTransparent: false,
        displayMode: 'adaptive',
        locale: 'en',
      }}
    />
  );
}

/** Crypto market heatmap (sized by market cap). */
export function TVCryptoHeatmap() {
  return (
    <WidgetShell
      id="tv-crypto-heatmap"
      src="https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js"
      height={520}
      label="Crypto market heatmap"
      config={{
        dataSource: 'Crypto',
        blockSize: 'market_cap',
        blockColor: 'change',
        locale: 'en',
        symbolUrl: '',
        colorTheme: 'dark',
        hasTopBar: false,
        isDataSetEnabled: false,
        isZoomEnabled: true,
        hasSymbolTooltip: true,
        width: '100%',
        height: '100%',
      }}
    />
  );
}

/** Crypto news timeline / top stories feed. */
export function TVTopStories() {
  return (
    <WidgetShell
      id="tv-top-stories"
      src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js"
      height={560}
      label="Crypto news"
      config={{
        feedMode: 'all_symbols',
        colorTheme: 'dark',
        isTransparent: false,
        displayMode: 'regular',
        width: '100%',
        height: '100%',
        locale: 'en',
      }}
    />
  );
}
