import express from 'express';
import cors from 'cors';
import { NewsScanner }          from './newsScanner.js';
import { StrategyEngine }       from './strategyEngine.js';
import { AgentEvolutionEngine } from './agentEvolution.js';
import { PaperTradingEngine }   from './paperEngine.js';
import { AgentOrchestrator }    from './agentOrchestrator.js';
import { BrokerBridge }         from './brokerBridge.js';
import { livePrices, startPriceFeed } from './priceService.js';
import { canTrade, getAllMarketStatuses, getMarketStatus } from './marketHours.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Engines ──────────────────────────────────────────────────────
const newsScanner     = new NewsScanner();
const strategyEngine  = new StrategyEngine();
const evolutionEngine = new AgentEvolutionEngine();
const paperEngine     = new PaperTradingEngine(5.00);
const orchestrator    = new AgentOrchestrator(evolutionEngine);
const brokerBridge    = new BrokerBridge();

// ── Real market price feed ────────────────────────────────────────
startPriceFeed();

// ── Asset List (BTC & XAU prioritized above all others) ────────────
let SYMBOLS = ['BTC', 'XAU', 'ETH', 'NVDA', 'AAPL', 'TSLA', 'SPY'];

// ── Auto-Pilot Config ─────────────────────────────────────────────
let isAutoPilotActive     = true;
let autoPilotSpeedSeconds = 10;
let confidenceThreshold   = 50;
let executionMode         = 'AGGRESSIVE';
let focusAssetsOnly       = true;
let autoPilotTimer        = null;
let currentSymbolIndex    = 0;
let lastSkippedReason     = null;

// Tracking AI Target & Focus
let currentTargetSymbol   = 'BTC';
let nextTargetSymbol      = 'XAU';
let plannedTrade          = null;

// ── Price helpers ─────────────────────────────────────────────────
function fallback(sym) {
  const fb = { BTC: 97000, XAU: 2510, ETH: 3700, NVDA: 138, AAPL: 228, TSLA: 242, SPY: 592 };
  return fb[sym] || 100;
}

function getPrices() {
  return Object.fromEntries(
    SYMBOLS.map(s => [s, {
      price:     livePrices[s]?.price     || fallback(s),
      change24h: livePrices[s]?.change24h || 0,
      high:      livePrices[s]?.high      || fallback(s) * 1.01,
      low:       livePrices[s]?.low       || fallback(s) * 0.99,
      rsi:       livePrices[s]?.rsi       || 50,
    }])
  );
}

// ── SL/TP checker ─────────────────────────────────────────────────
setInterval(() => {
  const priceMap = Object.fromEntries(SYMBOLS.map(s => [s, livePrices[s]?.price || fallback(s)]));
  paperEngine.checkAndTriggerOrders(priceMap, (closedTrade) => {
    evolutionEngine.recordTradeResult(closedTrade);
  });
}, 2000);

// ── Auto-pilot cycle ──────────────────────────────────────────────
async function runAutoPilotCycle() {
  const now    = new Date();
  const prices = getPrices();

  let activePool = SYMBOLS;
  if (focusAssetsOnly) {
    activePool = Math.random() < 0.8 ? ['BTC', 'XAU'] : SYMBOLS;
  }

  let attempts = 0;
  let sym;
  while (attempts < activePool.length) {
    const candidate = activePool[currentSymbolIndex % activePool.length];
    currentSymbolIndex++;
    attempts++;

    const mkt = getMarketStatus(candidate, now);
    if (mkt.tradeable) {
      sym = candidate;
      break;
    } else {
      console.log(`[AutoPilot] ⏸  ${candidate} market CLOSED — ${mkt.session}. Skipping.`);
      lastSkippedReason = `${candidate}: ${mkt.reason}`;
    }
  }

  if (!sym) sym = 'BTC';

  currentTargetSymbol = sym;
  nextTargetSymbol    = activePool[currentSymbolIndex % activePool.length];

  try {
    const newsList       = await newsScanner.scanMarketNews();
    const topNews        = newsScanner.getTopNewsForSymbol(sym)[0] || newsList[0];
    const activeStrategy = strategyEngine.evaluateAndSelectStrategy(sym, newsList, prices[sym]);

    const portfolio = paperEngine.getPortfolioSummary(
      Object.fromEntries(SYMBOLS.map(s => [s, prices[s].price]))
    );

    const debate = await orchestrator.runMultiAgentDebate({
      symbol:          sym,
      newsItem:        topNews,
      activeStrategy,
      marketState:     prices[sym],
      paperBalance:    portfolio.cashBalance,
    });

    const isBuySignal  = debate.consensusDecision === 'BUY';
    const isSellSignal = debate.consensusDecision === 'SELL';
    const meetsThreshold = debate.confidenceScore >= confidenceThreshold;

    plannedTrade = {
      symbol:            sym,
      newsTitle:         topNews?.title || 'Market Catalyst',
      consensusDecision: debate.consensusDecision,
      confidenceScore:   debate.confidenceScore,
      strategyName:      activeStrategy.name,
      targetPrice:       debate.targetPrice,
      stopLossPrice:     debate.stopLossPrice,
      currentPrice:      prices[sym].price,
      allocationUSD:    debate.tradeAllocationUSD,
      detectedRegime:    debate.detectedRegime,
      status:            (isBuySignal || isSellSignal) && meetsThreshold ? `PLANNING_${debate.consensusDecision}` : 'STANDBY',
    };

    if ((isBuySignal || isSellSignal) && meetsThreshold && isAutoPilotActive) {
      if (!canTrade(sym, now)) {
        console.log(`[AutoPilot] 🚫 Trade blocked: ${sym} market is ${getMarketStatus(sym,now).session}`);
        lastSkippedReason = `${sym} market closed — ${getMarketStatus(sym,now).reason}`;
        return;
      }

      const tradeSide = isBuySignal ? 'BUY' : 'SELL';

      // 1. Execute Paper Order
      paperEngine.executePaperTrade({
        symbol:        sym,
        side:          tradeSide,
        price:         prices[sym].price,
        amountUSD:     debate.tradeAllocationUSD,
        targetPrice:   debate.targetPrice,
        stopLossPrice: debate.stopLossPrice,
        strategyName:  activeStrategy.name,
        newsTitle:     topNews?.title || 'Market Signal',
        agentConsensus:`${tradeSide} (${debate.confidenceScore}% Consensus)`,
      });

      // 2. Dispatch Live Broker Order (if Live Broker Mode is enabled!)
      if (brokerBridge.mode === 'LIVE_BROKER') {
        await brokerBridge.dispatchLiveTrade({
          symbol:        sym,
          side:          tradeSide,
          amountUSD:     debate.tradeAllocationUSD,
          price:         prices[sym].price,
          stopLossPrice: debate.stopLossPrice,
          targetPrice:   debate.targetPrice,
          strategyName:  activeStrategy.name,
        });
      }

      lastSkippedReason = null;
    }
  } catch (err) {
    console.error('[AutoPilot] Cycle error:', err.message);
  }
}

function restartTimer() {
  if (autoPilotTimer) clearInterval(autoPilotTimer);
  autoPilotTimer = setInterval(runAutoPilotCycle, autoPilotSpeedSeconds * 1000);
}

restartTimer();
runAutoPilotCycle();

// ── REST endpoints ────────────────────────────────────────────────
app.get('/api/state', (req, res) => {
  const now      = new Date();
  const prices   = getPrices();
  const priceMap = Object.fromEntries(SYMBOLS.map(s => [s, prices[s].price]));
  const portfolio = paperEngine.getPortfolioSummary(priceMap);

  const marketStatuses = getAllMarketStatuses(now);
  Object.keys(prices).forEach(s => {
    prices[s].session   = marketStatuses[s]?.session   || 'UNKNOWN';
    prices[s].tradeable = marketStatuses[s]?.tradeable ?? true;
  });

  res.json({
    autoPilotActive:      isAutoPilotActive,
    autoPilotSpeedSeconds,
    confidenceThreshold,
    executionMode,
    focusAssetsOnly,
    portfolio,
    marketPrices:         prices,
    marketStatuses,
    lastSkippedReason,
    currentTargetSymbol,
    nextTargetSymbol,
    plannedTrade,
    brokerStatus:         brokerBridge.getStatus(),
    activeStrategy:       strategyEngine.activeStrategy,
    latestNews:           newsScanner.latestNews,
    latestDebate:         orchestrator.latestDebate,
    debateHistory:        orchestrator.debateHistory.slice(0, 10),
    agents:               evolutionEngine.getAgentsList(),
    generation:           evolutionEngine.generation,
    postMortems:          evolutionEngine.postMortems,
    evolutionLog:         evolutionEngine.evolutionLog.slice(0, 15),
    serverTime:           now.toISOString(),
  });
});

app.post('/api/autopilot', (req, res) => {
  const { active, speed } = req.body;
  if (typeof active === 'boolean') isAutoPilotActive = active;
  if (speed && speed >= 3) { autoPilotSpeedSeconds = speed; restartTimer(); }
  res.json({ success: true, isAutoPilotActive, autoPilotSpeedSeconds });
});

app.post('/api/execution-mode', (req, res) => {
  const { mode, focusBtcXau } = req.body;
  if (mode === 'AGGRESSIVE') {
    executionMode = 'AGGRESSIVE';
    confidenceThreshold = 50;
  } else if (mode === 'STANDARD') {
    executionMode = 'STANDARD';
    confidenceThreshold = 65;
  }
  if (typeof focusBtcXau === 'boolean') {
    focusAssetsOnly = focusBtcXau;
  }
  res.json({ success: true, executionMode, confidenceThreshold, focusAssetsOnly });
});

app.post('/api/wallet-config', (req, res) => {
  const { startingBalance, tradeAllocationUSD } = req.body;
  const bal = parseFloat(startingBalance);
  const alloc = parseFloat(tradeAllocationUSD);
  if (!isNaN(bal) && bal > 0) {
    paperEngine.resetAccount(bal, !isNaN(alloc) && alloc > 0 ? alloc : 1.50);
  }
  res.json({ success: true, portfolio: paperEngine.getPortfolioSummary() });
});

app.post('/api/broker-mode', (req, res) => {
  const { mode, brokerType, metaApiToken, metaAccountId, webhookUrl, webhookSecret } = req.body;
  const result = brokerBridge.setMode(mode, brokerType, {
    metaApiToken,
    metaAccountId,
    webhookUrl,
    webhookSecret,
  });
  res.json(result);
});

app.post('/api/trigger-cycle', async (req, res) => {
  await runAutoPilotCycle();
  res.json({ success: true });
});

app.post('/api/manual-trade', async (req, res) => {
  const { symbol, side, amountUSD } = req.body;
  const now    = new Date();
  const prices = getPrices();

  if (!symbol || !prices[symbol]) return res.status(400).json({ success: false, message: 'Invalid symbol' });

  const mkt = getMarketStatus(symbol, now);
  if (!mkt.tradeable) {
    return res.status(403).json({
      success: false,
      message: `Cannot trade ${symbol} — market is ${mkt.session}. ${mkt.reason}`,
    });
  }

  const price = prices[symbol].price;
  const strat = strategyEngine.activeStrategy;
  const result = paperEngine.executePaperTrade({
    symbol,
    side:          side || 'BUY',
    price,
    amountUSD:     amountUSD || 1.50,
    targetPrice:   price * (1 + (strat?.targetProfitPct || 0.035)),
    stopLossPrice: price * (1 - (strat?.stopLossPct     || 0.015)),
    strategyName:  'Manual Human Override',
    newsTitle:     'User Override Signal',
    agentConsensus:'HUMAN_OVERRIDE',
  });

  if (brokerBridge.mode === 'LIVE_BROKER') {
    await brokerBridge.dispatchLiveTrade({
      symbol,
      side: side || 'BUY',
      amountUSD: amountUSD || 1.50,
      price,
      stopLossPrice: price * (1 - (strat?.stopLossPct || 0.015)),
      targetPrice: price * (1 + (strat?.targetProfitPct || 0.035)),
      strategyName: 'Manual Human Override',
    });
  }

  res.json(result);
});

app.post('/api/close-position', (req, res) => {
  const { positionId } = req.body;
  const prices = getPrices();
  const pos    = paperEngine.positions.find(p => p.id === positionId);
  if (!pos) return res.status(404).json({ success: false });
  const closed = paperEngine.closePositionManually(positionId, prices[pos.symbol]?.price);
  if (closed) evolutionEngine.recordTradeResult(closed);
  res.json({ success: true, closed });
});

app.post('/api/fire-agent', (req, res) => {
  const { agentKey } = req.body;
  const upgraded = evolutionEngine.fireAndReplaceManually(agentKey);
  if (!upgraded) return res.status(400).json({ success: false });
  res.json({ success: true, upgradedAgent: upgraded });
});

app.post('/api/reset-account', (req, res) => {
  const { balance } = req.body;
  paperEngine.resetAccount(balance || 5.00);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 AlphaTrader server running on http://localhost:${PORT}`);
});
