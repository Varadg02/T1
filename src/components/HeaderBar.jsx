import React from 'react';
import { Search, Bell, Play, Pause, Zap, RotateCcw, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

export default function HeaderBar({ state, onToggleAutoPilot, onTriggerCycle, onResetAccount, onOpenManualTradeModal }) {
  const portfolio = state.portfolio || {};
  const totalEquity = portfolio.totalEquity || 5.00;
  const roiPct = portfolio.totalRoiPct || 0;
  const isPositive = roiPct >= 0;

  return (
    <header className="app-card p-4 mb-5 flex flex-wrap items-center justify-between gap-4">
      {/* User Profile Info (Matching screenshot "Hello, Brian") */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5 shadow-lg shadow-pink-500/20">
          <div className="w-full h-full rounded-[14px] bg-[#15151f] flex items-center justify-center text-pink-400 font-extrabold text-sm">
            AI
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Hello, AI Trader</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold mono">
              GEN {state.generation || 1}
            </span>
          </div>
          <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            Paper Capital: <span className="mono text-pink-400">${totalEquity.toFixed(2)}</span>
          </h1>
        </div>
      </div>

      {/* Center Status Pill */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-[#1c1c28] border border-white/5">
        <div className="flex items-center gap-2">
          <span className={state.autoPilotActive ? "live-dot-pink" : "w-2 h-2 rounded-full bg-slate-500 inline-block"}></span>
          <span className="text-xs font-semibold text-slate-300">
            Auto-Pilot: <strong className={state.autoPilotActive ? "text-pink-400" : "text-amber-400"}>
              {state.autoPilotActive ? 'RUNNING' : 'PAUSED'}
            </strong>
          </span>
        </div>

        <div className="w-px h-6 bg-white/10"></div>

        <div className="text-xs">
          <span className="text-slate-400 font-medium mr-1">Return:</span>
          <span className={`font-bold mono ${isPositive ? 'text-emerald-400' : 'text-pink-400'}`}>
            {isPositive ? '+' : ''}{roiPct.toFixed(2)}%
          </span>
        </div>

        <div className="w-px h-6 bg-white/10"></div>

        <div className="text-xs">
          <span className="text-slate-400 font-medium mr-1">Win Rate:</span>
          <span className="font-bold mono text-cyan-400">
            {(portfolio.winRatePct || 0).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAutoPilot}
          className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
            state.autoPilotActive
              ? 'btn-dark text-amber-300'
              : 'btn-pink'
          }`}
        >
          {state.autoPilotActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {state.autoPilotActive ? 'PAUSE AUTO' : 'START AUTO'}
        </button>

        <button
          onClick={onTriggerCycle}
          className="btn-dark text-xs flex items-center gap-1.5"
          title="Run News & AI Debate Cycle"
        >
          <Zap className="w-3.5 h-3.5 text-pink-400" />
          CYCLE
        </button>

        <button
          onClick={onOpenManualTradeModal}
          className="btn-white text-xs py-2.5 px-4 flex items-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-slate-900" />
          TRADE
        </button>

        <button
          onClick={onResetAccount}
          title="Reset balance to $5.00"
          className="p-2.5 rounded-full bg-[#1c1c28] text-slate-400 hover:text-white border border-white/5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
