// ════════════════════════════════════════════════════════════════
//  LIVE BROKER BRIDGE ENGINE (WITH FILE PERSISTENCE)
//  Connects the AI Trading Council to real-life brokers:
//  1. XM360 / XM Broker via MetaTrader 4 / 5 (MetaApi Cloud REST API)
//  2. Custom Webhook Gateway (PineConnector, Telegram, MT4/5 EA Webhooks)
//  3. Exchange APIs (Binance / Bybit / Crypto exchange keys)
// ════════════════════════════════════════════════════════════════

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'server', 'brokerConfig.json');

export class BrokerBridge {
  constructor() {
    this.mode = 'PAPER'; // 'PAPER' | 'LIVE_BROKER'
    this.brokerType = 'XM_METAAPI'; // 'XM_METAAPI' | 'WEBHOOK' | 'BINANCE'

    this.config = {
      metaApiToken:     process.env.METAAPI_TOKEN || '',
      metaAccountId:    process.env.METAAPI_ACCOUNT_ID || '',
      webhookUrl:       process.env.BROKER_WEBHOOK_URL || '',
      webhookSecret:    process.env.BROKER_WEBHOOK_SECRET || '',
      exchangeApiKey:   process.env.EXCHANGE_API_KEY || '',
      exchangeSecret:   process.env.EXCHANGE_SECRET || '',
      maxRealTradeUSD:  10.00,
    };

    this.logs = [];
    this.loadPersistentConfig();
  }

  loadPersistentConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const saved = JSON.parse(raw);
        if (saved.mode) this.mode = saved.mode;
        if (saved.brokerType) this.brokerType = saved.brokerType;
        if (saved.config) this.config = { ...this.config, ...saved.config };
        console.log(`[BrokerBridge] Loaded persistent config from brokerConfig.json (Mode: ${this.mode})`);
      }
    } catch (err) {
      console.error('[BrokerBridge] Error loading persistent broker config:', err.message);
    }
  }

  savePersistentConfig() {
    try {
      const data = {
        mode: this.mode,
        brokerType: this.brokerType,
        config: this.config,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[BrokerBridge] Saved persistent config to brokerConfig.json`);
    } catch (err) {
      console.error('[BrokerBridge] Error saving broker config:', err.message);
    }
  }

  log(msg, type = 'INFO') {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message: msg,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    console.log(`[BrokerBridge][${type}] ${msg}`);
  }

  setMode(mode, brokerType = 'XM_METAAPI', newConfig = {}) {
    this.mode = mode;
    this.brokerType = brokerType;
    this.config = { ...this.config, ...newConfig };
    this.savePersistentConfig();
    this.log(`Mode switched to: ${mode} (${brokerType})`);
    return { success: true, mode: this.mode, brokerType: this.brokerType, config: this.config };
  }

  async dispatchLiveTrade({ symbol, side, amountUSD, price, stopLossPrice, targetPrice, strategyName }) {
    if (this.mode !== 'LIVE_BROKER') {
      return { status: 'SKIPPED', reason: 'System in Paper Trading mode.' };
    }

    this.log(`🚀 Dispatching REAL order: ${side} ${symbol} @ $${price} (Val: $${amountUSD})`);

    try {
      if (this.brokerType === 'XM_METAAPI') {
        return await this.sendMetaApiTrade({ symbol, side, amountUSD, price, stopLossPrice, targetPrice });
      } else if (this.brokerType === 'WEBHOOK') {
        return await this.sendWebhookTrade({ symbol, side, amountUSD, price, stopLossPrice, targetPrice, strategyName });
      } else if (this.brokerType === 'BINANCE') {
        return await this.sendBinanceTrade({ symbol, side, amountUSD, price });
      }
    } catch (err) {
      this.log(`❌ Live order execution error: ${err.message}`, 'ERROR');
      return { status: 'FAILED', error: err.message };
    }
  }

  // ── 1. XM Broker via MetaApi REST API (MT4 / MT5) ─────────────
  async sendMetaApiTrade({ symbol, side, amountUSD, price, stopLossPrice, targetPrice }) {
    if (!this.config.metaApiToken || !this.config.metaAccountId) {
      this.log('❌ MetaApi Token or Account ID missing in settings.', 'ERROR');
      return { status: 'FAILED', error: 'MetaApi credentials not configured.' };
    }

    const xmSymbolMap = {
      BTC:  'BTCUSD',
      ETH:  'ETHUSD',
      XAU:  'GOLD',
      NVDA: 'NVDA',
      AAPL: 'AAPL',
      TSLA: 'TSLA',
      SPY:  'SPY',
    };
    const brokerSymbol = xmSymbolMap[symbol] || symbol;

    const actionType = side === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
    const url = `https://mt-client-api-v1.agile-01.us-east-1.metaapi.cloud/users/current/accounts/${this.config.metaAccountId}/trade`;

    const body = {
      actionType,
      symbol: brokerSymbol,
      volume: 0.01, // Micro lot sizing for small capital
      stopLoss: stopLossPrice || undefined,
      takeProfit: targetPrice || undefined,
      comment: 'AlphaTrader AI Council',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'auth-token': this.config.metaApiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `MetaApi Error ${res.status}`);

    this.log(`✅ XM Broker Trade Executed via MetaApi! Order ID: ${data.orderId || data.numericCode}`);
    return { status: 'EXECUTED', broker: 'XM (MetaTrader)', orderId: data.orderId || data.numericCode, response: data };
  }

  // ── 2. Universal Webhook Gateway ──────────────────────────────
  async sendWebhookTrade({ symbol, side, amountUSD, price, stopLossPrice, targetPrice, strategyName }) {
    if (!this.config.webhookUrl) {
      this.log('❌ Webhook URL missing in settings.', 'ERROR');
      return { status: 'FAILED', error: 'Webhook URL not configured.' };
    }

    const payload = {
      secret: this.config.webhookSecret,
      action: side,
      symbol: symbol === 'XAU' ? 'XAUUSD' : symbol,
      volume: 0.01,
      price,
      stopLoss: stopLossPrice,
      takeProfit: targetPrice,
      strategy: strategyName,
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Webhook HTTP Error ${res.status}`);
    this.log(`✅ Trade Signal Dispatched to Broker Webhook: ${side} ${symbol}`);
    return { status: 'EXECUTED', broker: 'Webhook Signal Gateway', payload };
  }

  // ── 3. Binance / Bybit Spot REST API ──────────────────────────
  async sendBinanceTrade({ symbol, side, amountUSD }) {
    this.log(`⚠️ Binance API integration stub ready for API Key: ${this.config.exchangeApiKey.slice(0, 4)}...`);
    return { status: 'SIMULATED_LIVE', broker: 'Binance API', symbol, side, amountUSD };
  }

  getStatus() {
    return {
      mode: this.mode,
      brokerType: this.brokerType,
      config: {
        metaApiToken: this.config.metaApiToken || '',
        metaAccountId: this.config.metaAccountId || '',
        webhookUrl: this.config.webhookUrl || '',
        webhookSecret: this.config.webhookSecret || '',
        maxRealTradeUSD: this.config.maxRealTradeUSD || 10.00,
      },
      isConfigured: Boolean(this.config.metaApiToken || this.config.webhookUrl || this.config.exchangeApiKey),
      logs: this.logs.slice(0, 15),
    };
  }
}
