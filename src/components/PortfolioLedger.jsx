import React, { useState } from 'react';
import { ArrowDownUp, TrendingUp, TrendingDown, DollarSign, Wallet, CheckCircle, XCircle } from 'lucide-react';

export default function PortfolioLedger({ portfolio, marketPrices, onClosePosition, onOpenManualTradeModal }) {
  const positions = portfolio.positions || [];
  const history = portfolio.tradeHistory || [];
  const [selectedPayToken, setSelectedPayToken] = useState('ETH');
  const [payAmount, setPayAmount] = useState('1.50');

  const ethPrice = marketPrices['ETH']?.price || 3723.02;
  const btcPrice = marketPrices['BTC']?.price || 97645.90;
  const nvdaPrice = marketPrices['NVDA']?.price || 138.50;
  const aaplPrice = marketPrices['AAPL']?.price || 228.40;

  return (
    <div className="space-y-5">
      {/* 1. Exchange Swap Calculator Card (Matching Left Phone in Uploaded Screenshot) */}
      <div className="app-card p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-white tracking-wide">Exchange & Paper Swap</h3>
          <span className="text-xs text-slate-400 mono font-semibold">
            Cash: <strong className="text-emerald-400">${(portfolio.cashBalance || 5.00).toFixed(2)}</strong>
          </span>
        </div>

        {/* Top Asset Swap Box */}
        <div className="app-card-alt p-4 mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">
                Ξ
              </div>
              <span className="font-extrabold text-white text-sm">ETH</span>
            </div>
            <span className="text-[11px] text-slate-400 mono">Balance: 293.0187</span>
          </div>

          <div className="text-2xl font-black text-white mono tracking-tight">
            12,695
          </div>
        </div>

        {/* Swap Icon Divider */}
        <div className="flex justify-center -my-3 z-10">
          <button
            onClick={onOpenManualTradeModal}
            className="w-9 h-9 rounded-full bg-[#252536] text-slate-300 hover:text-white border border-white/10 flex items-center justify-center shadow-lg transition-transform hover:rotate-180"
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Asset Swap Box */}
        <div className="app-card-alt p-4 mt-2 mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                $
              </div>
              <span className="font-extrabold text-white text-sm">USD</span>
            </div>
            <span className="text-[11px] text-slate-400 mono">Balance: ${(portfolio.cashBalance || 5.00).toFixed(2)}</span>
          </div>

          <div className="text-2xl font-black text-white mono tracking-tight">
            {(portfolio.cashBalance * 8787.4).toFixed(1)}
          </div>
        </div>

        {/* Exchange Rate Text matching screenshot */}
        <div className="text-center text-xs font-semibold text-slate-400 mb-4 mono">
          1 ETH = ${(ethPrice).toLocaleString()} USD
        </div>

        {/* Big White Buy Pill Button matching screenshot */}
        <button
          onClick={onOpenManualTradeModal}
          className="btn-white w-full text-center text-sm uppercase tracking-wider mb-4"
        >
          Buy ETH / Execute Trade
        </button>

        {/* Estimate Fee Details matching screenshot */}
        <div className="space-y-1 text-xs text-slate-400 pt-3 border-t border-white/5">
          <div className="flex justify-between">
            <span>Estimate fee</span>
            <span className="text-slate-200 mono font-semibold">0.00 USD (Paper Free)</span>
          </div>
          <div className="flex justify-between">
            <span>You will receive</span>
            <span className="text-slate-200 mono font-semibold">{(1.50 / ethPrice).toFixed(6)} ETH</span>
          </div>
        </div>
      </div>

      {/* 2. Asset Watchlist Grid (Matching Right Phone in Uploaded Screenshot) */}
      <div className="app-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-white tracking-wide">Watchlist & Holdings</h3>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
            <span className="text-white border-b-2 border-pink-500 pb-0.5">Watchlist</span>
            <span className="hover:text-white cursor-pointer">Saved</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Bitcoin Watch Card */}
          <div className="app-card-alt p-4 hover:border-pink-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-extrabold text-white text-sm">Bitcoin</h4>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">BTC</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                ₿
              </div>
            </div>

            <div className="text-lg font-black text-white mono mb-2">
              ${(btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            {/* Mini Pink Sparkline Line */}
            <div className="h-8 w-full my-1">
              <svg viewBox="0 0 100 25" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#ff2a85"
                  strokeWidth="2"
                  points="0,15 15,10 30,18 45,8 60,14 75,5 90,12 100,6"
                />
              </svg>
            </div>

            <div className="mt-2">
              <span className="badge-pct-green">
                ▲ +0.20% Today
              </span>
            </div>
          </div>

          {/* Ethereum Watch Card */}
          <div className="app-card-alt p-4 hover:border-pink-500/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-extrabold text-white text-sm">Ethereum</h4>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">ETH</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
                Ξ
              </div>
            </div>

            <div className="text-lg font-black text-white mono mb-2">
              ${(ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            {/* Mini Pink Sparkline Line */}
            <div className="h-8 w-full my-1">
              <svg viewBox="0 0 100 25" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#ff2a85"
                  strokeWidth="2"
                  points="0,8 15,14 30,9 45,18 60,10 75,20 90,12 100,16"
                />
              </svg>
            </div>

            <div className="mt-2">
              <span className="badge-pct-red">
                ▼ -0.73% Today
              </span>
            </div>
          </div>
        </div>

        {/* Active Open Positions List */}
        {positions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Active Open Orders</h4>
            <div className="space-y-2">
              {positions.map((pos) => (
                <div key={pos.id} className="app-card-alt p-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white mono text-xs">{pos.symbol} ({pos.side})</span>
                    <div className="text-[10px] text-slate-400 mono">Entry: ${pos.entryPrice}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold mono ${pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-pink-400'}`}>
                      ${pos.unrealizedPnL.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onClosePosition(pos.id)}
                      className="p-1 rounded-full bg-pink-500/20 text-pink-300 hover:bg-pink-500/40"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
