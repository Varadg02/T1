import React, { useMemo } from 'react';

// TradingView symbol map
const TV_SYMBOL_MAP = {
  BTC:  'BINANCE:BTCUSDT',
  ETH:  'BINANCE:ETHUSDT',
  NVDA: 'NASDAQ:NVDA',
  AAPL: 'NASDAQ:AAPL',
  TSLA: 'NASDAQ:TSLA',
  SPY:  'AMEX:SPY',
  XAU:  'TVC:GOLD',
};

// TradingView interval codes
const TF_MAP = {
  '1m':  '1',
  '5m':  '5',
  '15m': '15',
  '1h':  '60',
  '4h':  '240',
  '1d':  'D',
};

export default function TradingViewChart({ symbol = 'BTC', timeframe = '15m' }) {
  const tvSymbol   = TV_SYMBOL_MAP[symbol]  || 'BINANCE:BTCUSDT';
  const tvInterval = TF_MAP[timeframe]       || '15';

  // Build the iframe src — use the lightweight widgetembed endpoint
  // This is the most reliable free embed that requires no login
  const src = useMemo(() => {
    const studies = encodeURIComponent(
      JSON.stringify([
        { id: 'RSI@tv-basicstudies' },
        { id: 'MACD@tv-basicstudies' },
        { id: 'BB@tv-basicstudies' },
      ])
    );
    const params = new URLSearchParams({
      symbol:           tvSymbol,
      interval:         tvInterval,
      theme:            'dark',
      style:            '1',          // Candles
      locale:           'en',
      timezone:         'Etc/UTC',
      backgroundColor:  '#0d0d0f',
      hide_top_toolbar: '0',
      hide_legend:      '0',
      allow_symbol_change: '0',
      save_image:       '0',
      hide_volume:      '0',
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}&studies=${studies}`;
  }, [tvSymbol, tvInterval]);

  return (
    <iframe
      key={`${symbol}-${timeframe}`}   /* force remount when symbol/tf changes */
      src={src}
      title={`${symbol} TradingView Chart`}
      allowTransparency
      allowFullScreen
      frameBorder="0"
      scrolling="no"
      style={{
        width:        '100%',
        height:       '100%',
        minHeight:    420,
        display:      'block',
        border:       'none',
        background:   '#0d0d0f',
        colorScheme:  'dark',
      }}
    />
  );
}
