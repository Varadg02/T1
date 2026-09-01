// Paper Trading Engine - Manages paper capital & customizable starting wallet
// Tracks position sizing, real-time unrealized PnL, stop-loss / take-profit execution, win rates.

export class PaperTradingEngine {
  constructor(initialBalance = 5.00) {
    this.initialBalance = initialBalance;
    this.cashBalance = initialBalance;
    this.defaultAllocationUSD = 1.50;
    this.positions = [];
    this.tradeHistory = [];
    this.totalTradesCount = 0;
    this.winningTradesCount = 0;
  }

  getPortfolioSummary(currentPrices = {}) {
    let openPositionsValue = 0;
    let totalUnrealizedPnL = 0;

    const enrichedPositions = this.positions.map(pos => {
      const livePrice = currentPrices[pos.symbol] || pos.entryPrice;
      const priceDiff = pos.side === 'BUY' ? (livePrice - pos.entryPrice) : (pos.entryPrice - livePrice);
      const unrealizedPnL = priceDiff * pos.quantity;
      const unrealizedPnLPct = (priceDiff / pos.entryPrice) * 100;
      const currentValue = pos.quantity * livePrice;

      openPositionsValue += currentValue;
      totalUnrealizedPnL += unrealizedPnL;

      return {
        ...pos,
        currentPrice: livePrice,
        unrealizedPnL,
        unrealizedPnLPct,
        currentValue
      };
    });

    const totalEquity = this.cashBalance + openPositionsValue;
    const totalPnL = totalEquity - this.initialBalance;
    const totalRoiPct = this.initialBalance > 0 ? (totalPnL / this.initialBalance) * 100 : 0;
    const winRatePct = this.totalTradesCount > 0 ? (this.winningTradesCount / this.totalTradesCount) * 100 : 0;

    return {
      initialBalance: this.initialBalance,
      cashBalance: this.cashBalance,
      defaultAllocationUSD: this.defaultAllocationUSD,
      openPositionsValue,
      totalEquity,
      totalPnL,
      totalRoiPct,
      totalTradesCount: this.totalTradesCount,
      winningTradesCount: this.winningTradesCount,
      winRatePct,
      positions: enrichedPositions,
      tradeHistory: this.tradeHistory.slice(0, 15)
    };
  }

  executePaperTrade({ symbol, side, price, amountUSD, targetPrice, stopLossPrice, strategyName, newsTitle, agentConsensus }) {
    const tradeAllocation = Math.min(amountUSD || this.defaultAllocationUSD || 1.50, this.cashBalance);
    if (tradeAllocation < 0.20) {
      return { success: false, reason: 'INSORTIENT_FUNDS', message: 'Insufficient cash balance to place trade.' };
    }

    const quantity = tradeAllocation / price;
    this.cashBalance -= tradeAllocation;

    const newPosition = {
      id: `pos-${Date.now().toString(36)}`,
      symbol,
      side,
      entryPrice: price,
      quantity,
      costBasis: tradeAllocation,
      targetPrice: targetPrice || (price * 1.03),
      stopLossPrice: stopLossPrice || (price * 0.985),
      strategyName: strategyName || 'Auto-Pilot Catalyst',
      newsTitle: newsTitle || 'Market Catalyst Signal',
      agentConsensus: agentConsensus || 'Consensus Buy',
      openedAt: new Date().toISOString()
    };

    this.positions.unshift(newPosition);
    return { success: true, position: newPosition };
  }

  checkAndTriggerOrders(currentPrices, onTradeClosedCallback) {
    const closedList = [];

    this.positions = this.positions.filter(pos => {
      const livePrice = currentPrices[pos.symbol];
      if (!livePrice) return true;

      let triggerReason = null;
      if (pos.side === 'BUY') {
        if (livePrice >= pos.targetPrice) triggerReason = 'TAKE_PROFIT_HIT';
        else if (livePrice <= pos.stopLossPrice) triggerReason = 'STOP_LOSS_HIT';
      } else if (pos.side === 'SELL') {
        if (livePrice <= pos.targetPrice) triggerReason = 'TAKE_PROFIT_HIT';
        else if (livePrice >= pos.stopLossPrice) triggerReason = 'STOP_LOSS_HIT';
      }

      if (triggerReason) {
        const exitValue = pos.quantity * livePrice;
        const pnl = pos.side === 'BUY' ? (exitValue - pos.costBasis) : (pos.costBasis - exitValue);
        const pnlPct = (pnl / pos.costBasis) * 100;

        this.cashBalance += exitValue;
        this.totalTradesCount += 1;
        if (pnl > 0) this.winningTradesCount += 1;

        const closedRecord = {
          ...pos,
          exitPrice: livePrice,
          exitValue,
          pnl,
          pnlPct,
          reason: triggerReason,
          closedAt: new Date().toISOString()
        };

        this.tradeHistory.unshift(closedRecord);
        closedList.push(closedRecord);

        if (onTradeClosedCallback) {
          onTradeClosedCallback(closedRecord);
        }

        return false;
      }

      return true;
    });

    return closedList;
  }

  closePositionManually(positionId, currentPrice) {
    const posIndex = this.positions.findIndex(p => p.id === positionId);
    if (posIndex === -1) return null;

    const pos = this.positions[posIndex];
    const price = currentPrice || pos.entryPrice;
    const exitValue = pos.quantity * price;
    const pnl = pos.side === 'BUY' ? (exitValue - pos.costBasis) : (pos.costBasis - exitValue);
    const pnlPct = (pnl / pos.costBasis) * 100;

    this.cashBalance += exitValue;
    this.totalTradesCount += 1;
    if (pnl > 0) this.winningTradesCount += 1;

    const closedRecord = {
      ...pos,
      exitPrice: price,
      exitValue,
      pnl,
      pnlPct,
      reason: 'MANUAL_HUMAN_CLOSE',
      closedAt: new Date().toISOString()
    };

    this.positions.splice(posIndex, 1);
    this.tradeHistory.unshift(closedRecord);
    return closedRecord;
  }

  resetAccount(newBalance = 5.00, allocationUSD = 1.50) {
    this.initialBalance = Number(newBalance) || 5.00;
    this.cashBalance = Number(newBalance) || 5.00;
    this.defaultAllocationUSD = Number(allocationUSD) || 1.50;
    this.positions = [];
    this.tradeHistory = [];
    this.totalTradesCount = 0;
    this.winningTradesCount = 0;
  }
}
