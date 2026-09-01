// ════════════════════════════════════════════════════════════════
//  DEDICATED RISK MANAGEMENT & SURVIVAL INSTINCT MODULE
//
//  Equips AI Agents with Survival Instincts (Extinction Avoidance,
//  Pre-Trade Reflection, Drawdown Fear) and Advanced Risk Evaluation
//  (Monte Carlo Stress Testing, Slippage Simulation, Kelly Sizing).
// ════════════════════════════════════════════════════════════════

export class RiskManagementModule {
  constructor() {
    this.consecutiveLosses = 0;
    this.consecutiveWins = 0;
    this.peakBalance = 5.00;
    this.lowestBalance = 5.00;
    this.tradeHistoryLog = [];
  }

  /**
   * Calculates the current Account Survival Index (0–100%)
   * Higher score = healthy capital cushion; lower score = extinction fear activated.
   */
  calculateSurvivalIndex(currentBalance, initialBalance = 5.00) {
    if (currentBalance > this.peakBalance) this.peakBalance = currentBalance;
    if (currentBalance < this.lowestBalance) this.lowestBalance = currentBalance;

    const drawdownPct = Math.max(0, ((this.peakBalance - currentBalance) / this.peakBalance) * 100);
    const balanceRatio = (currentBalance / initialBalance) * 100;
    
    // Penalize streak losses
    const streakPenalty = this.consecutiveLosses * 8;

    let survivalScore = balanceRatio - (drawdownPct * 0.8) - streakPenalty;
    survivalScore = Math.max(5, Math.min(100, survivalScore)); // Bound 5-100

    return {
      score: Math.round(survivalScore),
      drawdownPct: parseFloat(drawdownPct.toFixed(1)),
      streakLosses: this.consecutiveLosses,
      extinctionFearActive: currentBalance < (initialBalance * 0.6) || this.consecutiveLosses >= 3,
      status: survivalScore > 75 ? 'OPTIMAL_HEALTH' : survivalScore > 45 ? 'CAUTIOUS' : 'CRITICAL_SURVIVAL',
    };
  }

  /**
   * Runs Pre-Trade Reflection & Survival Instinct Thought Process
   */
  runSurvivalInstinctReflection({ symbol, side, price, amountUSD, paperBalance, marketState }) {
    const survival = this.calculateSurvivalIndex(paperBalance);
    const rsi = marketState?.rsi || 50;
    const dayRange = marketState ? ((marketState.high - marketState.low) / price) * 100 : 2.0;

    let thoughtLog = [];
    let isApproved = true;
    let recommendedAllocationUSD = amountUSD;
    let survivalVetoReason = null;

    // 1. Fear of Extinction Check
    if (survival.extinctionFearActive) {
      thoughtLog.push(`⚠️ SURVIVAL INSTINCT TRIGGERED: Capital at $${paperBalance.toFixed(2)} (${survival.drawdownPct}% drawdown). Extinction threat elevated!`);
      // Shrink allocation by 50% to protect remaining capital
      recommendedAllocationUSD = Math.max(0.20, amountUSD * 0.5);
      thoughtLog.push(`🛡️ Preserving capital: Reduced allocation from $${amountUSD.toFixed(2)} to $${recommendedAllocationUSD.toFixed(2)}.`);
    } else {
      thoughtLog.push(`✅ Account Survival Index is ${survival.score}% (${survival.status}). Capital cushion healthy.`);
    }

    // 2. Pre-Trade "What If" Reflection
    const simulatedWorstLossUSD = recommendedAllocationUSD * 0.03; // Assume 3% worst loss
    const remainingAfterLoss = paperBalance - simulatedWorstLossUSD;

    thoughtLog.push(`🤔 Reflection: "If this ${side} on ${symbol} hits stop-loss, we lose -$${simulatedWorstLossUSD.toFixed(3)}. Remaining balance: $${remainingAfterLoss.toFixed(2)}."`);

    if (remainingAfterLoss < 0.50) {
      isApproved = false;
      survivalVetoReason = `VETO: Potential loss (-$${simulatedWorstLossUSD.toFixed(2)}) risks account extinction.`;
      thoughtLog.push(`🚨 ${survivalVetoReason}`);
    } else {
      thoughtLog.push(`✅ Survival Check Passed: Account remains viable after simulated loss.`);
    }

    return {
      isApproved,
      survivalScore: survival.score,
      status: survival.status,
      extinctionFearActive: survival.extinctionFearActive,
      recommendedAllocationUSD: parseFloat(recommendedAllocationUSD.toFixed(2)),
      thoughtLog,
      survivalVetoReason,
    };
  }

  /**
   * Runs Monte Carlo & Flash-Crash Stress Testing on Trade Proposal
   */
  runMonteCarloStressTest({ symbol, side, price, stopLossPrice, targetPrice, allocationUSD, paperBalance }) {
    const stopDistancePct = Math.abs((price - stopLossPrice) / price);
    const targetDistancePct = Math.abs((targetPrice - price) / price);
    
    // Simulate 1,000 randomized market paths with slippage and news volatility
    const iterations = 1000;
    let simulatedWins = 0;
    let simulatedLosses = 0;
    let maxSimulatedDrawdownUSD = 0;

    for (let i = 0; i < iterations; i++) {
      // Add random volatility noise (-2.5% to +2.5%)
      const noise = (Math.random() - 0.49) * 0.05;
      const slippage = Math.random() * 0.005; // Up to 0.5% slippage

      const simReturn = (side === 'BUY' ? noise : -noise) - slippage;

      if (simReturn >= targetDistancePct * 0.8) {
        simulatedWins++;
      } else if (simReturn <= -stopDistancePct) {
        simulatedLosses++;
        const simLoss = allocationUSD * stopDistancePct;
        if (simLoss > maxSimulatedDrawdownUSD) maxSimulatedDrawdownUSD = simLoss;
      }
    }

    const simulatedWinRate = Math.round((simulatedWins / iterations) * 100);
    const maxDrawdownPctOfAccount = (maxSimulatedDrawdownUSD / paperBalance) * 100;
    const stressPass = simulatedWinRate >= 45 && maxDrawdownPctOfAccount <= 20;

    return {
      stressPass,
      simulatedWinRate,
      maxSimulatedDrawdownUSD: parseFloat(maxSimulatedDrawdownUSD.toFixed(3)),
      maxDrawdownPctOfAccount: parseFloat(maxDrawdownPctOfAccount.toFixed(1)),
      verdict: stressPass ? 'STRESS_TEST_PASSED' : 'STRESS_TEST_FAILED',
      summary: stressPass 
        ? `Passed 1,000 Monte Carlo paths: ${simulatedWinRate}% win rate, max simulated drawdown $${maxSimulatedDrawdownUSD.toFixed(2)} (${maxDrawdownPctOfAccount.toFixed(1)}% of account).`
        : `FAILED Monte Carlo stress test: ${simulatedWinRate}% win rate too low or drawdown risk excessive (${maxDrawdownPctOfAccount.toFixed(1)}%).`,
    };
  }

  recordTradeOutcome(isWin) {
    if (isWin) {
      this.consecutiveWins++;
      this.consecutiveLosses = 0;
    } else {
      this.consecutiveLosses++;
      this.consecutiveWins = 0;
    }
  }
}
