import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';

export default function StrategyPanel({ activeStrategy }) {
  if (!activeStrategy) return null;

  return (
    <div className="app-card p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-extrabold text-white tracking-wide">STRATEGY OPTIMIZER</h2>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 mono">
          {activeStrategy.matchScore}% MATCH
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Active Strategy</span>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            {activeStrategy.name}
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c1c28] text-slate-300 font-normal mono border border-white/5">
              {activeStrategy.type}
            </span>
          </h3>
        </div>

        <p className="text-xs text-slate-300 app-card-alt p-3 leading-relaxed">
          {activeStrategy.rationale}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="app-card-alt p-2.5">
            <span className="text-slate-400 text-[10px] block font-bold">Target Profit</span>
            <span className="font-extrabold text-emerald-400 mono">+{(activeStrategy.targetProfitPct * 100).toFixed(1)}%</span>
          </div>
          <div className="app-card-alt p-2.5">
            <span className="text-slate-400 text-[10px] block font-bold">Stop Loss</span>
            <span className="font-extrabold text-pink-400 mono">-{(activeStrategy.stopLossPct * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Execution Rules</span>
          <div className="space-y-1">
            {activeStrategy.rules?.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
