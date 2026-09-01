// ════════════════════════════════════════════════════════════════
//  AGENT COUNCIL v3 — 10-Agent Autonomous Trading Council
//  Equipped with Survival Instincts & Dedicated Risk Management Module
// ════════════════════════════════════════════════════════════════

export class AgentEvolutionEngine {
  constructor() {
    this.generation = 1;
    this.agentRegistry = {

      // ── 1. MacroOracle ─────────────────────────────────────────
      MacroOracle: {
        id: 'ag-macro-v1',
        name: 'MacroOracle',
        version: 1,
        role: 'Macro Intelligence & Catalyst Scanner',
        description: 'Evaluates macro regime: Fed rates, DXY strength, VIX fear index, CPI/inflation, earnings surprises, geopolitical risk, and how each news headline fits the big picture.',
        why: 'Cross-references news against macro backdrop — e.g., a bullish crypto headline during a Fed rate hike cycle gets discounted.',
        status: 'ACTIVE',
        avatar: '🌍',
        color: '#38bdf8',
        weight: 1.2,
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'Discount bullish crypto signals during strong DXY (USD strength) regimes.',
          'Earnings week increases volatility — widen stop losses automatically.',
          'VIX > 25 = risk-off regime: only HOLD or defensive SELL positions.',
        ]
      },

      // ── 2. TechWizard ──────────────────────────────────────────
      TechWizard: {
        id: 'ag-tech-v1',
        name: 'TechWizard',
        version: 1,
        role: 'Multi-Indicator Technical Analysis Engine',
        description: 'Runs confluence analysis across RSI, MACD histogram momentum, Bollinger Band squeeze/expansion, EMA 20/50 crossover, volume delta.',
        why: 'Requires 3+ indicator confluence before voting BUY or SELL to prevent false breakouts.',
        status: 'ACTIVE',
        avatar: '📐',
        color: '#a855f7',
        weight: 1.3,
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'Require RSI + MACD + volume agreement for any BUY signal.',
          'Bollinger Band squeeze followed by expansion = high-probability breakout.',
          'EMA 20 must be above EMA 50 for bullish bias. Never fight the trend.',
        ]
      },

      // ── 3. RiskSentinel (Risk Module 1) ───────────────────────
      RiskSentinel: {
        id: 'ag-risk-v1',
        name: 'RiskSentinel',
        version: 1,
        role: 'Dynamic Risk & Portfolio Guardian',
        description: 'ATR-based dynamic stop loss, Kelly Criterion position sizing, max portfolio heat check, and correlation risk guards.',
        why: 'Calculates stop distance from asset ATR volatility (e.g. BTC ~3%, XAU ~1.2%) instead of arbitrary fixed percentages.',
        status: 'ACTIVE',
        avatar: '🛡️',
        color: '#f43f5e',
        weight: 1.5, // VETO Power
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'ATR-based stops: BTC ~3%, ETH ~4%, NVDA/TSLA ~2.5%, AAPL/SPY ~1.5%, XAU ~1.2%.',
          'Never risk more than 20% of total balance on a single trade (Kelly constraint).',
          'If account is down >30% from peak, HOLD all new trades — capital preservation mode.',
        ]
      },

      // ── 4. SurvivalInstinctGuard (Risk Module 2 - NEW) ─────────
      SurvivalInstinctGuard: {
        id: 'ag-survival-v1',
        name: 'SurvivalInstinctGuard',
        version: 1,
        role: 'Account Survival & Extinction Prevention Specialist',
        description: 'NEW AGENT. Evaluates account Survival Index, runs pre-trade "what if" reflections, monitors drawdown fear, and enforces extinction avoidance.',
        why: 'Gives agents genuine survival instinct — when account equity drops or loss streaks occur, it shrinks allocation or vetoes trade to avoid account wipeout.',
        status: 'ACTIVE',
        avatar: '👁️',
        color: '#00f2fe',
        weight: 1.4, // VETO Power
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'Survival Index < 50% = shrink allocation size by 50% immediately.',
          'Before executing any order, simulate worst-case loss and verify account survival margin.',
          'Extinction avoidance overrides greed: holding cash is victory when survival is threatened.',
        ]
      },

      // ── 5. StressTester (Risk Module 3 - NEW) ─────────────────
      StressTester: {
        id: 'ag-stress-v1',
        name: 'StressTester',
        version: 1,
        role: 'Monte Carlo & Flash-Crash Stress Testing Specialist',
        description: 'NEW AGENT. Runs 1,000 simulated price paths considering high slippage, news spikes, and flash crash liquidity gaps before trade approval.',
        why: 'Tests trade resilience against extreme market conditions before committing capital.',
        status: 'ACTIVE',
        avatar: '🧪',
        color: '#ec4899',
        weight: 1.3, // VETO Power
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'Monte Carlo win rate < 45% = VETO trade setup regardless of news.',
          'Max simulated drawdown > 20% of account = REJECT order.',
          'Slippage penalty applied to all simulated entries for safety margin.',
        ]
      },

      // ── 6. CrowdMind ───────────────────────────────────────────
      CrowdMind: {
        id: 'ag-crowd-v1',
        name: 'CrowdMind',
        version: 1,
        role: 'Behavioral Finance & Crowd Sentiment Analyst',
        description: 'Measures Fear & Greed dynamics, short interest ratio, and contrarian reversal opportunities.',
        why: 'Detects retail extreme greed or panic fear to execute high-probability contrarian trades.',
        status: 'ACTIVE',
        avatar: '🧠',
        color: '#f59e0b',
        weight: 0.9,
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'Extreme greed (>80) is a contrarian sell signal.',
          'Extreme fear (<20) is a contrarian buy signal.',
        ]
      },

      // ── 7. OnChainSeer ─────────────────────────────────────────
      OnChainSeer: {
        id: 'ag-chain-v1',
        name: 'OnChainSeer',
        version: 1,
        role: 'On-Chain Flow & Whale Intelligence Agent',
        description: 'Tracks crypto on-chain whale accumulation, exchange inflow/outflow balance, and institutional block trades.',
        why: 'On-chain exchange outflows lead price action by 24-48 hours.',
        status: 'ACTIVE',
        avatar: '⛓️',
        color: '#06b6d4',
        weight: 1.1,
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'Large BTC exchange outflow (>10k BTC) = accumulation signal: BUY.',
          'Spike in exchange inflow = sell pressure incoming: HOLD.',
        ]
      },

      // ── 8. RegimeDetector ──────────────────────────────────────
      RegimeDetector: {
        id: 'ag-regime-v1',
        name: 'RegimeDetector',
        version: 1,
        role: 'Market Regime Classification & Veto Agent',
        description: 'Classifies market into: TRENDING_UP, TRENDING_DOWN, RANGING/CHOPPY, or HIGH_VOLATILITY.',
        why: 'Vetoes momentum trades in choppy/ranging markets to prevent whipsaw losses.',
        status: 'ACTIVE',
        avatar: '🌡️',
        color: '#10b981',
        weight: 1.4, // VETO Power
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'ADX < 20 = choppy market: veto momentum strategies.',
          'ADX > 25 = strong trend: momentum strategies valid.',
        ]
      },

      // ── 9. ArbitrageHunter ─────────────────────────────────────
      ArbitrageHunter: {
        id: 'ag-arb-v1',
        name: 'ArbitrageHunter',
        version: 1,
        role: 'Cross-Asset Correlation & Spread Intelligence',
        description: 'Monitors BTC dominance, gold vs DXY inverse correlation, and sector rotation signals.',
        why: 'Inter-market relationships signal high-probability trend reversals.',
        status: 'ACTIVE',
        avatar: '🔀',
        color: '#8b5cf6',
        weight: 0.8,
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'DXY > 104 = gold (XAU) headwinds. DXY < 100 = XAU tailwind.',
        ]
      },

      // ── 10. ChiefStrategist ────────────────────────────────────
      ChiefStrategist: {
        id: 'ag-chief-v1',
        name: 'ChiefStrategist',
        version: 1,
        role: 'Weighted Consensus Synthesis & Execution Lead',
        description: 'Applies confidence-weighted voting, respects Risk & Survival VETO powers, and manages adaptive position sizing.',
        why: 'Synthesizes all 9 specialized agents into a unified, risk-evaluated trading decision.',
        status: 'ACTIVE',
        avatar: '👑',
        color: '#22c55e',
        weight: 1.0,
        tradesParticipated: 0, winCount: 0, lossCount: 0,
        memory: [
          'RiskSentinel, SurvivalInstinctGuard, and RegimeDetector hold VETO power.',
          'Require weighted consensus > threshold before order placement.',
        ]
      },
    };

    this.evolutionLog = [];
    this.postMortems  = [];
  }

  recordTradeResult(trade) {
    const isWin = trade.pnl > 0;
    Object.keys(this.agentRegistry).forEach(key => {
      const ag = this.agentRegistry[key];
      ag.tradesParticipated += 1;
      if (isWin) ag.winCount++; else ag.lossCount++;
    });
    if (!isWin) this.triggerSelfHealing(trade);
  }

  triggerSelfHealing(failedTrade) {
    this.generation += 1;

    let culpritKey = 'RiskSentinel';
    let failureReason = 'Stop loss distance did not account for asset ATR volatility.';

    if (failedTrade.reason === 'STOP_LOSS_HIT') {
      const stopPct = Math.abs((failedTrade.stopLossPrice - failedTrade.entryPrice) / failedTrade.entryPrice);
      if (stopPct < 0.02) {
        culpritKey = 'RiskSentinel';
        failureReason = `Stop at ${(stopPct*100).toFixed(1)}% was too tight for ${failedTrade.symbol} volatility.`;
      } else {
        culpritKey = 'TechWizard';
        failureReason = `Entry signal for ${failedTrade.symbol} had insufficient indicator confluence.`;
      }
    } else if (failedTrade.newsImpact < 0.7) {
      culpritKey = 'MacroOracle';
      failureReason = `Overweighted a low-impact news catalyst (impact: ${failedTrade.newsImpact}).`;
    } else {
      culpritKey = 'SurvivalInstinctGuard';
      failureReason = `Pre-trade loss reflection underestimated volatility drawdown. Survival parameters recalibrated.`;
    }

    const oldAgent  = this.agentRegistry[culpritKey] || this.agentRegistry['RiskSentinel'];
    const newVersion = oldAgent.version + 1;

    const postMortem = {
      id: `pm-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      failedTradeId: failedTrade.id,
      symbol:   failedTrade.symbol,
      pnl:      failedTrade.pnl,
      lossPct:  failedTrade.pnlPct,
      culpritAgent:   oldAgent.name,
      culpritVersion: oldAgent.version,
      rootCause:   failureReason,
      actionTaken: `Fired ${oldAgent.name} v${oldAgent.version} → Deployed v${newVersion} with failure intel`,
      lessonLearned: `LESSON #${newVersion}: On ${failedTrade.symbol} — ${failureReason}`,
    };
    this.postMortems.unshift(postMortem);

    this.agentRegistry[culpritKey] = {
      ...oldAgent,
      id:      `ag-${culpritKey.toLowerCase()}-v${newVersion}`,
      version: newVersion,
      winCount: 0, lossCount: 0, tradesParticipated: 0,
      memory: [
        ...oldAgent.memory,
        `⚠️ FAILURE INTEL (${failedTrade.symbol}, v${oldAgent.version}): ${failureReason}`,
      ],
    };

    this.evolutionLog.unshift({
      id: `evo-${Date.now().toString(36)}`,
      timestamp:  new Date().toISOString(),
      generation: this.generation,
      type:       'AGENT_REPLACEMENT',
      message:    `⚡ SELF-HEALING: Fired ${oldAgent.name} v${oldAgent.version} after ${failedTrade.symbol} loss. Deployed v${newVersion} with root-cause intel.`,
    });

    return postMortem;
  }

  fireAndReplaceManually(agentKey) {
    if (!this.agentRegistry[agentKey]) return null;
    const old = this.agentRegistry[agentKey];
    const newV = old.version + 1;
    const upgraded = {
      ...old,
      id: `ag-${agentKey.toLowerCase()}-v${newV}`,
      version: newV,
      winCount: 0, lossCount: 0, tradesParticipated: 0,
      memory: [...old.memory, `👤 HUMAN OVERRIDE v${newV}: Re-calibrated by human operator command.`],
    };
    this.agentRegistry[agentKey] = upgraded;
    this.generation += 1;

    this.evolutionLog.unshift({
      id: `evo-${Date.now().toString(36)}`,
      timestamp:  new Date().toISOString(),
      generation: this.generation,
      type:       'MANUAL_REPLACEMENT',
      message:    `👤 HUMAN INTERFERENCE: Manually fired ${old.name} v${old.version} → deployed ${upgraded.name} v${newV}.`,
    });
    return upgraded;
  }

  getAgentsList() {
    return Object.values(this.agentRegistry);
  }
}
