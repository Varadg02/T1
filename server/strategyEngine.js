// ════════════════════════════════════════════════════════════════
//  MULTI-STRATEGY DYNAMIC SELECTION ENGINE
//  Scans, scores, and matches across multiple trading strategies
//  tailored for Crypto (BTC/ETH), Gold (XAUUSD), Equities & Macro.
// ════════════════════════════════════════════════════════════════

export const STRATEGIES = {
  NEWS_BREAKOUT: {
    id: "STRAT_NEWS_BREAKOUT",
    name: "News Sentiment Momentum Breakout",
    type: "Momentum",
    timeframe: "5m / 15m",
    targetProfitPct: 0.035, // +3.5%
    stopLossPct: 0.015,     // -1.5%
    description: "Capitalizes on high-impact bullish news catalysts backed by volume spike and directional momentum.",
    rules: [
      "News impact rating > 0.80",
      "News Sentiment = Bullish",
      "RSI > 50 & Trending Upward",
      "Risk-Reward Ratio >= 2.3:1"
    ]
  },
  MEAN_REVERSION: {
    id: "STRAT_MEAN_REVERSION",
    name: "Mean Reversion & Volatility Squeeze",
    type: "Reversion",
    timeframe: "15m",
    targetProfitPct: 0.025, // +2.5%
    stopLossPct: 0.012,     // -1.2%
    description: "Identifies overextended price movements following noise news, betting on price returning to VWAP/20 MA.",
    rules: [
      "RSI < 35 (Oversold) or RSI > 68 (Overbought)",
      "Price deviation from 20 MA > 2%",
      "Volume declining (exhaustion signal)"
    ]
  },
  MACRO_TREND: {
    id: "STRAT_MACRO_TREND",
    name: "Macro Trend Following",
    type: "Trend",
    timeframe: "1h",
    targetProfitPct: 0.050, // +5.0%
    stopLossPct: 0.020,     // -2.0%
    description: "Aligns paper/live trades with institutional order flow and macro economic news direction.",
    rules: [
      "Price above 50 SMA and 200 SMA",
      "Macro sentiment score positive across > 3 news sources",
      "Trailing stop-loss enabled"
    ]
  },
  NEWS_SCALP: {
    id: "STRAT_NEWS_SCALP",
    name: "News Reaction Scalp",
    type: "Scalp",
    timeframe: "1m / 5m",
    targetProfitPct: 0.018, // +1.8%
    stopLossPct: 0.009,     // -0.9%
    description: "Ultra-fast position entry designed to capture initial liquidity surge following sudden news release.",
    rules: [
      "News timestamp < 5 minutes old",
      "Relevance = Critical or High",
      "Tight 1:2 Risk ratio with active trailing stop"
    ]
  },
  GOLD_SAFE_HAVEN_ROTATION: {
    id: "STRAT_GOLD_SAFE_HAVEN",
    name: "Gold (XAU) Safe-Haven Capital Flight",
    type: "Defensive Trend",
    timeframe: "15m / 1h",
    targetProfitPct: 0.028, // +2.8%
    stopLossPct: 0.010,     // -1.0%
    description: "Specialized strategy for Gold (XAUUSD). Captures capital flight into Gold during market fear, geopolitical noise, or USD index pullback.",
    rules: [
      "Symbol = XAU (Gold Futures / Spot)",
      "Market sentiment risk-off or DXY index under pressure",
      "RSI between 40 and 65 (healthy accumulation phase)",
      "R:R Ratio >= 2.8:1"
    ]
  },
  BITCOIN_LIQUIDITY_BREAKOUT: {
    id: "STRAT_BTC_LIQUIDITY",
    name: "Bitcoin Volatility Squeeze & Liquidity Hunt",
    type: "Crypto Momentum",
    timeframe: "15m / 1h",
    targetProfitPct: 0.045, // +4.5%
    stopLossPct: 0.018,     // -1.8%
    description: "Specialized BTC momentum strategy. Enters when Bitcoin breaks out of tight consolidation range supported by on-chain whale activity.",
    rules: [
      "Symbol = BTC",
      "24h Price change magnitude > 1.8%",
      "On-chain exchange outflow pattern confirmed",
      "ATR Volatility expansion"
    ]
  },
  RANGE_BOUND_GRID: {
    id: "STRAT_RANGE_GRID",
    name: "Range-Bound Consolidation Grid",
    type: "Grid",
    timeframe: "15m",
    targetProfitPct: 0.020, // +2.0%
    stopLossPct: 0.010,     // -1.0%
    description: "Captures range oscillations during low-volatility market regimes when no clear macro trend exists.",
    rules: [
      "ADX Trend Strength < 20 (Choppy/Range)",
      "RSI oscillating between 40 and 60",
      "Price bounded within 24h high-low range"
    ]
  }
};

export class StrategyEngine {
  constructor() {
    this.activeStrategy = STRATEGIES.BITCOIN_LIQUIDITY_BREAKOUT;
    this.evaluatedStrategies = [];
  }

  evaluateAndSelectStrategy(symbol, newsList, marketState) {
    const symbolNews = newsList.filter(n => n.symbol === symbol);
    const topNews = symbolNews[0] || newsList[0];

    const impactScore = topNews ? parseFloat(topNews.impact || 0.7) : 0.7;
    const rsi = marketState?.rsi || 55;
    const priceChange = marketState?.change24h || 1.5;

    // Score all available strategies dynamically
    const scoredList = Object.values(STRATEGIES).map(strat => {
      let score = 50; // base score

      // Asset-specific preference
      if (symbol === 'XAU' && strat.id === 'STRAT_GOLD_SAFE_HAVEN') score += 35;
      if (symbol === 'BTC' && strat.id === 'STRAT_BTC_LIQUIDITY') score += 35;

      // News breakout condition
      if (strat.type === 'Momentum' && impactScore > 0.85 && topNews?.sentiment === 'Bullish') {
        score += 30;
      }

      // Mean reversion condition
      if (strat.type === 'Reversion' && (rsi < 35 || rsi > 68)) {
        score += 28;
      }

      // Macro trend condition
      if (strat.type === 'Trend' && Math.abs(priceChange) > 2.5) {
        score += 25;
      }

      // Range grid condition
      if (strat.type === 'Grid' && Math.abs(priceChange) < 1.0) {
        score += 20;
      }

      return {
        ...strat,
        matchScore: Math.min(98, Math.max(60, score)),
      };
    });

    // Sort by match score descending
    scoredList.sort((a, b) => b.matchScore - a.matchScore);
    this.evaluatedStrategies = scoredList;

    const selected = scoredList[0];

    let rationale = `Selected ${selected.name} (${selected.type}) with ${selected.matchScore}% confidence score based on ${symbol} price action (RSI ${rsi.toFixed(1)}, 24h: ${priceChange}%) and news catalyst.`;

    if (symbol === 'XAU') {
      rationale = `XAU (Gold) specialized strategy active: ${selected.name}. R:R ratio ${((selected.targetProfitPct/selected.stopLossPct)).toFixed(1)}:1 matched for Gold futures volatility.`;
    } else if (symbol === 'BTC') {
      rationale = `BTC specialized strategy active: ${selected.name}. Optimized for Bitcoin liquidity breakouts with ${selected.matchScore}% match score.`;
    }

    this.activeStrategy = {
      ...selected,
      rationale,
    };

    return this.activeStrategy;
  }

  getAllStrategies() {
    return Object.values(STRATEGIES);
  }
}
