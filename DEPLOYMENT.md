# 🚀 24/7 Cloud Deployment & Real Broker Guide

This document explains:
1. **How to run this Trading Bot 24/7 in the Cloud** (for FREE on Render / Railway / Fly.io / VPS) so your laptop doesn't need to stay open.
2. **How to connect Real XM360 Broker / MT4 / MT5 Accounts** for live real-life trading.

---

## Part 1: How to Run 24/7 in the Cloud (Free Options)

Since your laptop turns off, you can deploy this Node.js app to free cloud hosting platforms in under 5 minutes.

### Option A: Deploy on Render.com (Easiest - Free Tier)

1. **Push your code to GitHub**:
   - Create a free account at [github.com](https://github.com).
   - Create a repository and push this trading project directory to GitHub.

2. **Deploy on Render**:
   - Create a free account at [Render.com](https://render.com).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
   - Set the settings:
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `node server/index.js`
   - Click **Create Web Service**.

Render will host your trading backend & frontend 24/7 continuously! The AI Council will scan news and trade BTC & XAU even while you sleep.

---

### Option B: Deploy on Railway.app / Fly.io

1. Create an account at [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects Node.js and starts `server/index.js`.

---

## Part 2: How to Connect Real Broker (XM360 / MT4 / MT5)

XM operates using MetaTrader 4 (MT4) and MetaTrader 5 (MT5). There are two seamless ways to connect our AI Council to your XM account:

### Method 1: Direct MetaApi REST Connection (Recommended for XM)

MetaApi provides a cloud REST API that bridges Node.js directly into MetaTrader 4 / 5 accounts.

1. **Get MetaApi Credentials**:
   - Sign up for a free account at [MetaApi.cloud](https://metaapi.cloud).
   - Go to **Accounts** -> **Connect Account** -> Select **MetaTrader 4** or **MetaTrader 5**.
   - Input your XM Broker server details (e.g. `XMGlobal-Real 1` or Demo server) and account login.
   - Copy your **Auth Token** and **Account ID**.

2. **Connect in AlphaTrader UI**:
   - Click **📄 PAPER MODE ($5)** button in the top bar of AlphaTrader.
   - Switch to **🔴 REAL BROKER**.
   - Select **XM Broker (via MetaTrader 4/5 MetaApi)**.
   - Paste your MetaApi Token & Account ID and click **Save & Connect**.

Whenever the AI Council agrees on a BUY or SELL signal for BTC or XAU (GOLD), a micro-lot order (`0.01 lot`) will automatically execute in your real XM MetaTrader account!

---

### Method 2: Universal Webhook (PineConnector / MT5 EA)

If you use a MetaTrader Expert Advisor (EA) or PineConnector:

1. In AlphaTrader UI, select **Universal Webhook**.
2. Enter your Webhook Dispatch URL (e.g. `https://your-mt5-ea.com/trade`).
3. Click **Save & Connect**.

---

## Part 3: Priority Focus & Fast Trade Mode Settings

- **Primary Asset Focus**: The bot prioritizes **BTC** (24/7 Crypto) and **XAUUSD** (Gold - 23h Futures).
- **Aggressive Trade Speed**: Click **⚡ AGGRESSIVE** in the top bar to set the confidence threshold to `50%`, allowing signals to trigger immediately when catalysts appear.
