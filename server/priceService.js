// Real-time market price service
// - Crypto (BTC, ETH): CoinGecko free API (no key)
// - Stocks (NVDA, AAPL, TSLA, SPY): Yahoo Finance via yahoo-finance2
// - Gold (XAU): Yahoo Finance GC=F futures
// Refreshes every 30 seconds

import YahooFinanceClass from 'yahoo-finance2';
// v3: the default export IS the class — instantiate it
const yahooFinance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price' +
  '?ids=bitcoin,ethereum' +
  '&vs_currencies=usd' +
  '&include_24hr_change=true' +
  '&include_24hr_vol=true' +
  '&include_high_low=true';

// Yahoo Finance tickers
const STOCK_TICKERS = {
  NVDA: 'NVDA',
  AAPL: 'AAPL',
  TSLA: 'TSLA',
  SPY:  'SPY',
  XAU:  'GC=F',   // Gold Futures (closest to spot XAU/USD)
};

// Normalised price store – same shape the rest of the app expects
export const livePrices = {
  BTC:  { price: 0, change24h: 0, high: 0, low: 0, rsi: 50 },
  ETH:  { price: 0, change24h: 0, high: 0, low: 0, rsi: 50 },
  NVDA: { price: 0, change24h: 0, high: 0, low: 0, rsi: 50 },
  AAPL: { price: 0, change24h: 0, high: 0, low: 0, rsi: 50 },
  TSLA: { price: 0, change24h: 0, high: 0, low: 0, rsi: 50 },
  SPY:  { price: 0, change24h: 0, high: 0, low: 0, rsi: 50 },
  XAU:  { price: 0, change24h: 0, high: 0, low: 0, rsi: 50 },
};

// Tracks previous closes for RSI approximation
const prevClose = {};

function approxRSI(sym, currentPrice) {
  const prev = prevClose[sym];
  if (!prev) { prevClose[sym] = currentPrice; return 50; }
  const change = currentPrice - prev;
  prevClose[sym] = currentPrice;
  // Weighted accumulate a simple 14-period RSI approximation from prev value
  const cur = livePrices[sym]?.rsi ?? 50;
  const gain = change > 0 ? change : 0;
  const loss = change < 0 ? -change : 0;
  const avgGain = gain;
  const avgLoss = loss;
  if (avgLoss === 0) return Math.min(99, cur + 1);
  const rs = avgGain / avgLoss;
  const newRSI = 100 - 100 / (1 + rs);
  // Blend with previous RSI to smooth it
  return parseFloat((cur * 0.85 + newRSI * 0.15).toFixed(1));
}

// ── Fetch Crypto prices from CoinGecko ─────────────────────────
async function fetchCrypto() {
  try {
    const res  = await fetch(COINGECKO_URL, { timeout: 8000 });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();

    const btcPrice = data.bitcoin?.usd || livePrices.BTC.price || 97000;
    const ethPrice = data.ethereum?.usd || livePrices.ETH.price || 3700;

    livePrices.BTC = {
      price:     parseFloat(btcPrice.toFixed(2)),
      change24h: parseFloat((data.bitcoin?.usd_24h_change || 0).toFixed(2)),
      high:      parseFloat(((data.bitcoin?.usd_24h_high)  || btcPrice * 1.02).toFixed(2)),
      low:       parseFloat(((data.bitcoin?.usd_24h_low)   || btcPrice * 0.98).toFixed(2)),
      rsi:       approxRSI('BTC', btcPrice),
    };

    livePrices.ETH = {
      price:     parseFloat(ethPrice.toFixed(2)),
      change24h: parseFloat((data.ethereum?.usd_24h_change || 0).toFixed(2)),
      high:      parseFloat(((data.ethereum?.usd_24h_high)  || ethPrice * 1.02).toFixed(2)),
      low:       parseFloat(((data.ethereum?.usd_24h_low)   || ethPrice * 0.98).toFixed(2)),
      rsi:       approxRSI('ETH', ethPrice),
    };

    console.log(`[Price] BTC $${livePrices.BTC.price}  ETH $${livePrices.ETH.price}`);
  } catch (err) {
    console.error('[Price] CoinGecko error:', err.message);
  }
}

// ── Fetch Stock + Gold prices from Yahoo Finance ───────────────
async function fetchStocks() {
  const syms = Object.keys(STOCK_TICKERS);
  for (const sym of syms) {
    try {
      const ticker = STOCK_TICKERS[sym];
      const quote  = await yahooFinance.quote(ticker);
      if (!quote || !quote.regularMarketPrice) continue;

      const price     = parseFloat(quote.regularMarketPrice.toFixed(2));
      // Use regularMarketChangePercent directly — most accurate from Yahoo
      const change24h = parseFloat((quote.regularMarketChangePercent || 0).toFixed(2));
      const high      = parseFloat((quote.regularMarketDayHigh  || price * 1.01).toFixed(2));
      const low       = parseFloat((quote.regularMarketDayLow   || price * 0.99).toFixed(2));

      livePrices[sym] = {
        price,
        change24h,
        high,
        low,
        rsi: approxRSI(sym, price),
      };

      console.log(`[Price] ${sym} $${price}  (${change24h > 0 ? '+' : ''}${change24h}%)`);
    } catch (err) {
      console.error(`[Price] Yahoo Finance error for ${sym}:`, err.message);
    }
  }
}

// ── Single refresh cycle ───────────────────────────────────────
export async function refreshPrices() {
  await Promise.allSettled([fetchCrypto(), fetchStocks()]);
}

// ── Startup: fetch immediately then every 30s ──────────────────
export function startPriceFeed() {
  console.log('[PriceFeed] Starting real-time market price service…');
  refreshPrices();
  setInterval(refreshPrices, 30_000);
}
