// ════════════════════════════════════════════════════════════════
//  Market Hours Guard
//  All times evaluated in US Eastern Time (ET).
//
//  Asset classes:
//  - CRYPTO  (BTC, ETH)       : 24/7 — always tradeable
//  - US_EQUITY (NVDA, AAPL, TSLA, SPY) : Mon–Fri 09:30–16:00 ET
//  - GOLD_FUTURES (XAU / GC=F): Sun 18:00 – Fri 17:00 ET
//                               1-hour break 17:00–18:00 ET daily
// ════════════════════════════════════════════════════════════════

const ASSET_CLASS = {
  BTC:  'CRYPTO',
  ETH:  'CRYPTO',
  NVDA: 'US_EQUITY',
  AAPL: 'US_EQUITY',
  TSLA: 'US_EQUITY',
  SPY:  'US_EQUITY',
  XAU:  'GOLD_FUTURES',
};

// Session labels
export const SESSION = {
  OPEN:        'OPEN',
  CLOSED:      'CLOSED',
  PRE_MARKET:  'PRE-MARKET',    // US equity 04:00–09:30 ET
  AFTER_HOURS: 'AFTER-HOURS',   // US equity 16:00–20:00 ET
  WEEKEND:     'WEEKEND',
  BREAK:       'DAILY BREAK',   // Gold 17:00–18:00 ET
};

// Convert any Date to Eastern Time components
function toET(date = new Date()) {
  // 'America/New_York' handles EST/EDT automatically
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:  'America/New_York',
    weekday:   'short',
    hour:      'numeric',
    minute:    'numeric',
    hour12:    false,
  }).formatToParts(date);

  const get = (t) => parts.find(p => p.type === t)?.value;
  const day  = get('weekday');   // 'Mon', 'Tue', … 'Sun'
  const hour = parseInt(get('hour'),   10);   // 0–23
  const min  = parseInt(get('minute'), 10);   // 0–59

  return { day, hour, min, totalMins: hour * 60 + min };
}

// ── US Equity session check ───────────────────────────────────
function usEquitySession(et) {
  const { day, totalMins } = et;
  const WEEKEND = ['Sat', 'Sun'];
  if (WEEKEND.includes(day)) return SESSION.WEEKEND;

  const PRE_OPEN  =  4 * 60;       // 04:00 ET
  const OPEN      =  9 * 60 + 30;  // 09:30 ET
  const CLOSE     = 16 * 60;       // 16:00 ET
  const AH_CLOSE  = 20 * 60;       // 20:00 ET

  if (totalMins < PRE_OPEN)   return SESSION.CLOSED;
  if (totalMins < OPEN)       return SESSION.PRE_MARKET;
  if (totalMins < CLOSE)      return SESSION.OPEN;
  if (totalMins < AH_CLOSE)   return SESSION.AFTER_HOURS;
  return SESSION.CLOSED;
}

// ── Gold Futures session check ────────────────────────────────
// CME Globex GC: Sun 18:00 – Fri 17:00 ET, break 17:00–18:00 daily
function goldFuturesSession(et) {
  const { day, totalMins } = et;
  const BREAK_START = 17 * 60;  // 17:00 ET
  const BREAK_END   = 18 * 60;  // 18:00 ET

  // Weekend: Sat all day closed; Sun before 18:00 closed
  if (day === 'Sat') return SESSION.WEEKEND;
  if (day === 'Sun' && totalMins < BREAK_END) return SESSION.WEEKEND;

  // Friday after 17:00 ET — closed for weekend
  if (day === 'Fri' && totalMins >= BREAK_START) return SESSION.WEEKEND;

  // Daily maintenance break 17:00–18:00 ET (Mon–Thu)
  if (totalMins >= BREAK_START && totalMins < BREAK_END) return SESSION.BREAK;

  return SESSION.OPEN;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Returns the session status for a given symbol.
 * @param {string} symbol  e.g. 'BTC', 'AAPL', 'XAU'
 * @param {Date}   [now]   Optional date (defaults to Date.now())
 * @returns {{ session: string, tradeable: boolean, reason: string }}
 */
export function getMarketStatus(symbol, now = new Date()) {
  const assetClass = ASSET_CLASS[symbol] || 'US_EQUITY';

  if (assetClass === 'CRYPTO') {
    return {
      session:   SESSION.OPEN,
      tradeable: true,
      reason:    `${symbol} trades 24/7 — market always open.`,
    };
  }

  const et = toET(now);

  if (assetClass === 'GOLD_FUTURES') {
    const session = goldFuturesSession(et);
    return {
      session,
      tradeable: session === SESSION.OPEN,
      reason: session === SESSION.OPEN
        ? `XAU futures (CME Globex) open — trading active.`
        : session === SESSION.WEEKEND
          ? `XAU futures closed for weekend (Sat all day, Sun before 18:00 ET).`
          : `XAU daily maintenance break 17:00–18:00 ET.`,
    };
  }

  // US_EQUITY
  const session = usEquitySession(et);
  const etStr   = `${et.hour.toString().padStart(2,'0')}:${et.min.toString().padStart(2,'0')} ET (${et.day})`;
  return {
    session,
    tradeable: session === SESSION.OPEN,
    reason: session === SESSION.OPEN
      ? `NYSE/NASDAQ open 09:30–16:00 ET — trading active (${etStr}).`
      : session === SESSION.PRE_MARKET
        ? `Pre-market hours (04:00–09:30 ET). Regular session opens at 09:30 ET (${etStr}).`
        : session === SESSION.AFTER_HOURS
          ? `After-hours trading (16:00–20:00 ET). Regular session closed at 16:00 ET (${etStr}).`
          : session === SESSION.WEEKEND
            ? `Weekend — US equity markets closed. Opens Monday 09:30 ET.`
            : `US markets closed. Regular session is Mon–Fri 09:30–16:00 ET (${etStr}).`,
  };
}

/**
 * Returns a full status map for all symbols.
 */
export function getAllMarketStatuses(now = new Date()) {
  const symbols = Object.keys(ASSET_CLASS);
  return Object.fromEntries(symbols.map(s => [s, getMarketStatus(s, now)]));
}

/**
 * Returns true only if the symbol can be paper-traded right now.
 * Crypto = always. Stocks = regular session only. Gold = futures hours.
 */
export function canTrade(symbol, now = new Date()) {
  return getMarketStatus(symbol, now).tradeable;
}
