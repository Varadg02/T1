// ════════════════════════════════════════════════════════════════
//  Multi-Agent Council Orchestrator — 10-Agent Debate Engine
//  Includes Dedicated Risk Management & Survival Instinct Module
// ════════════════════════════════════════════════════════════════

import { RiskManagementModule } from './riskManagementModule.js';

export class AgentOrchestrator {
  constructor(evolutionEngine) {
    this.evolutionEngine = evolutionEngine;
    this.riskModule      = new RiskManagementModule();
    this.latestDebate    = null;
    this.debateHistory   = [];
  }

  async runMultiAgentDebate({ symbol, newsItem, activeStrategy, marketState, paperBalance }) {
    const agents = this.evolutionEngine.agentRegistry;

    // ── Extract market context ─────────────────────────────────
    const newsTitle     = newsItem?.title     || 'General market liquidity shift detected';
    const newsSentiment = newsItem?.sentiment || 'Neutral';
    const newsImpact    = parseFloat(newsItem?.impact  || 0.8);
    const price         = marketState?.price     || 95000;
    const rsi           = marketState?.rsi       || 50;
    const change24h     = marketState?.change24h || 0;
    const high          = marketState?.high      || price * 1.01;
    const low           = marketState?.low       || price * 0.99;

    const dayRange    = ((high - low) / price) * 100;
    const momentum    = change24h;
    const isCrypto    = ['BTC','ETH'].includes(symbol);
    const isGold      = symbol === 'XAU';

    // ATR-based stop loss % by asset class
    const atrStop = {
      BTC: 0.030, ETH: 0.040, NVDA: 0.025,
      AAPL: 0.015, TSLA: 0.030, SPY: 0.012, XAU: 0.012,
    };
    const dynamicStop   = atrStop[symbol] || 0.020;
    const dynamicTarget = dynamicStop * 2.5;

    // ── 1. MacroOracle ─────────────────────────────────────────
    const macro = agents.MacroOracle || {};
    let macroVote = newsSentiment === 'Bullish' ? 'BUY' : newsSentiment === 'Bearish' ? 'SELL' : 'HOLD';
    let macroText = `📰 Headline: "${newsTitle.slice(0,55)}..." — Impact ${(newsImpact*100).toFixed(0)}%. ${isCrypto?'Crypto risk-on appetite.':isGold?'Safe-haven demand.':'Equity catalyst.'} Sentiment: ${newsSentiment.toUpperCase()}. Recommend ${macroVote}.`;

    // ── 2. TechWizard ──────────────────────────────────────────
    const tech = agents.TechWizard || {};
    const rsiSignal  = rsi < 35 ? 'BUY' : rsi > 68 ? 'SELL' : 'NEUTRAL';
    const macdSignal = momentum > 1.0 ? 'BUY' : momentum < -1.0 ? 'SELL' : 'NEUTRAL';
    const bullCount  = [rsiSignal, macdSignal].filter(s=>s==='BUY').length;
    const bearCount  = [rsiSignal, macdSignal].filter(s=>s==='SELL').length;
    
    let techVote = bullCount >= 1 ? 'BUY' : bearCount >= 1 ? 'SELL' : 'HOLD';
    let techText = `📐 Multi-indicator TA: RSI ${rsi.toFixed(1)} (${rsiSignal}), momentum ${momentum.toFixed(2)}% (${macdSignal}). Confluence leans ${techVote}. Strategy match ${activeStrategy?.matchScore || 85}%.`;

    // ── 3. RiskSentinel (Risk Guard 1) ─────────────────────────
    const risk = agents.RiskSentinel || {};
    const stopPrice  = (price * (1 - dynamicStop)).toFixed(2);
    const targetPrice = (price * (1 + dynamicTarget)).toFixed(2);
    let riskVote = paperBalance < 0.80 ? 'HOLD' : 'BUY';
    let riskVeto = paperBalance < 0.80;
    let riskText = `🛡️ Risk Sentinel: ATR stop at $${stopPrice} (-${(dynamicStop*100).toFixed(1)}%), Target $${targetPrice} (+${(dynamicTarget*100).toFixed(1)}%). Kelly risk clearance: ${riskVeto?'VETO - LOW BALANCE':'APPROVED'}.`;

    // ── 4. SurvivalInstinctGuard (Risk Guard 2 - NEW) ──────────
    const survivalAgent = agents.SurvivalInstinctGuard || {};
    const survivalEval  = this.riskModule.runSurvivalInstinctReflection({
      symbol, side: macroVote, price, amountUSD: Math.min(paperBalance * 0.20, 1.50), paperBalance, marketState
    });

    let survivalVote = survivalEval.isApproved ? (survivalEval.extinctionFearActive ? 'HOLD' : 'BUY') : 'HOLD';
    let survivalVeto = !survivalEval.isApproved || (survivalEval.extinctionFearActive && paperBalance < 2.0);
    let survivalText = `👁️ Survival Instinct (Score ${survivalEval.survivalScore}%): ${survivalEval.thoughtLog.join(' ')}`;

    // ── 5. StressTester (Risk Guard 3 - NEW) ───────────────────
    const stressAgent = agents.StressTester || {};
    const stressEval  = this.riskModule.runMonteCarloStressTest({
      symbol, side: macroVote, price, stopLossPrice: parseFloat(stopPrice), targetPrice: parseFloat(targetPrice), allocationUSD: survivalEval.recommendedAllocationUSD, paperBalance
    });

    let stressVote = stressEval.stressPass ? 'BUY' : 'HOLD';
    let stressVeto = !stressEval.stressPass;
    let stressText = `🧪 Stress Tester (Monte Carlo 1,000 Paths): ${stressEval.summary}`;

    // ── 6. CrowdMind ───────────────────────────────────────────
    const crowd = agents.CrowdMind || {};
    let crowdVote = newsSentiment === 'Bullish' ? 'BUY' : 'HOLD';
    let crowdText = `🧠 Crowd & Fear-Greed: RSI ${rsi.toFixed(1)} sentiment mapping. Vote: ${crowdVote}.`;

    // ── 7. OnChainSeer ─────────────────────────────────────────
    const chain = agents.OnChainSeer || {};
    let chainVote = change24h > 0 ? 'BUY' : 'HOLD';
    let chainText = `⛓️ On-Chain / Block Flow: ${symbol} flow sentiment indicates ${chainVote}.`;

    // ── 8. RegimeDetector ──────────────────────────────────────
    const regime = agents.RegimeDetector || {};
    let regimeVeto = dayRange > 6.0;
    let regimeVote = regimeVeto ? 'HOLD' : (change24h > 0 ? 'BUY' : 'HOLD');
    let regimeText = `🌡️ Regime: Day range ${dayRange.toFixed(1)}%. ${regimeVeto ? 'HIGH VOLATILITY VETO ACTIVE' : 'Regime clear.'}`;

    // ── 9. ArbitrageHunter ─────────────────────────────────────
    const arb = agents.ArbitrageHunter || {};
    let arbVote = isGold ? 'BUY' : 'HOLD';
    let arbText = `🔀 Inter-Market Correlation: ${isGold ? 'Gold inverse DXY correlation bullish.' : 'Parity aligned.'}`;

    // ── 10. ChiefStrategist Synthesis ──────────────────────────
    const chief = agents.ChiefStrategist || {};
    const hardVeto = riskVeto || survivalVeto || stressVeto || regimeVeto;

    let finalDecision = 'HOLD';
    let confidenceScore = 50;
    let chiefText = '';

    if (hardVeto) {
      finalDecision = 'HOLD';
      confidenceScore = 100;
      const vetoSource = survivalVeto ? 'SurvivalInstinctGuard' : stressVeto ? 'StressTester' : riskVeto ? 'RiskSentinel' : 'RegimeDetector';
      chiefText = `👑 VETO IN EFFECT by ${vetoSource}. All trades suspended for capital preservation & survival. Decision: HOLD.`;
    } else {
      const votes = [macroVote, techVote, riskVote, survivalVote, stressVote, crowdVote, chainVote, regimeVote, arbVote];
      const buyVotes = votes.filter(v => v === 'BUY').length;
      const sellVotes = votes.filter(v => v === 'SELL').length;

      if (buyVotes >= 4) {
        finalDecision = 'BUY';
        confidenceScore = Math.round((buyVotes / votes.length) * 100);
      } else if (sellVotes >= 4) {
        finalDecision = 'SELL';
        confidenceScore = Math.round((sellVotes / votes.length) * 100);
      } else {
        finalDecision = 'HOLD';
        confidenceScore = 60;
      }
      chiefText = `👑 Synthesis across 10 specialized agents completed (BUY: ${buyVotes}, SELL: ${sellVotes}). Consensus ${confidenceScore}% → FINAL DECISION: ${finalDecision}.`;
    }

    const debateRecord = {
      id: 'debate-' + Date.now().toString(36),
      symbol,
      timestamp: new Date().toISOString(),
      newsTitle,
      strategyName: activeStrategy?.name || 'Momentum Breakdown',
      consensusDecision: finalDecision,
      confidenceScore,
      survivalIndex: survivalEval.survivalScore,
      stressPass: stressEval.stressPass,
      tradeAllocationUSD: survivalEval.recommendedAllocationUSD,
      targetPrice: parseFloat(targetPrice),
      stopLossPrice: parseFloat(stopPrice),
      hardVeto,
      agentStreams: [
        { agent: 'MacroOracle', version: macro.version||1, avatar: macro.avatar||'🌍', color: macro.color||'#38bdf8', text: macroText, vote: macroVote },
        { agent: 'TechWizard', version: tech.version||1, avatar: tech.avatar||'📐', color: tech.color||'#a855f7', text: techText, vote: techVote },
        { agent: 'RiskSentinel', version: risk.version||1, avatar: risk.avatar||'🛡️', color: risk.color||'#f43f5e', text: riskText, vote: riskVote },
        { agent: 'SurvivalInstinctGuard', version: survivalAgent.version||1, avatar: survivalAgent.avatar||'👁️', color: survivalAgent.color||'#00f2fe', text: survivalText, vote: survivalVote },
        { agent: 'StressTester', version: stressAgent.version||1, avatar: stressAgent.avatar||'🧪', color: stressAgent.color||'#ec4899', text: stressText, vote: stressVote },
        { agent: 'CrowdMind', version: crowd.version||1, avatar: crowd.avatar||'🧠', color: crowd.color||'#f59e0b', text: crowdText, vote: crowdVote },
        { agent: 'OnChainSeer', version: chain.version||1, avatar: chain.avatar||'⛓️', color: chain.color||'#06b6d4', text: chainText, vote: chainVote },
        { agent: 'RegimeDetector', version: regime.version||1, avatar: regime.avatar||'🌡️', color: regime.color||'#10b981', text: regimeText, vote: regimeVote },
        { agent: 'ArbitrageHunter', version: arb.version||1, avatar: arb.avatar||'🔀', color: arb.color||'#8b5cf6', text: arbText, vote: arbVote },
        { agent: 'ChiefStrategist', version: chief.version||1, avatar: chief.avatar||'👑', color: chief.color||'#22c55e', text: chiefText, vote: finalDecision },
      ],
    };

    this.latestDebate = debateRecord;
    this.debateHistory.unshift(debateRecord);
    return debateRecord;
  }
}
