'use client';

import Script from 'next/script';

// Free TradingView Advanced Chart embed. `tvSymbol` like "KRAKEN:BTCUSD".
export function TradingViewChart({ tvSymbol }: { tvSymbol: string }) {
  const config = {
    autosize: true,
    symbol: tvSymbol,
    interval: '60',
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'en',
    hide_side_toolbar: false,
    allow_symbol_change: false,
    save_image: false,
    backgroundColor: 'rgba(13, 20, 36, 1)',
    gridColor: 'rgba(28, 39, 64, 0.6)',
  };
  return (
    <div className="tradingview-widget-container h-[480px] sm:h-[560px] rounded-2xl overflow-hidden border border-edge bg-panel">
      <div className="tradingview-widget-container__widget h-full" />
      <Script
        id={`tv-advanced-${tvSymbol.replace(/[^A-Z]/gi, '')}`}
        src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
        strategy="lazyOnload"
      >
        {JSON.stringify(config)}
      </Script>
    </div>
  );
}
