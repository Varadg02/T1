import React from 'react';
import { BrainCircuit, AlertOctagon, Sparkles } from 'lucide-react';

export default function AgentEvolutionLab({ generation, postMortems, evolutionLog }) {
  return (
    <div className="app-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-pink-400" />
          <h2 className="text-sm font-extrabold text-white tracking-wide">SELF-HEALING AGENT EVOLUTION LAB</h2>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30 mono">
          GEN {generation}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Post-Mortem Failure Analysis Log */}
        <div className="app-card-alt p-3.5 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-extrabold text-white">
            <AlertOctagon className="w-4 h-4 text-pink-400" />
            <span>POST-MORTEM FAILURE REPORTS</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] pr-1">
            {postMortems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                No trade failures recorded yet! All agents currently performing cleanly.
              </div>
            ) : (
              postMortems.map((pm) => (
                <div key={pm.id} className="p-3 rounded-xl bg-pink-950/20 border border-pink-500/30 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-pink-300 mono">{pm.symbol} Loss (${pm.pnl.toFixed(2)})</span>
                    <span className="text-[10px] text-slate-400">{new Date(pm.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mb-1.5">
                    <strong className="text-pink-400">Root Cause:</strong> {pm.rootCause}
                  </p>
                  <div className="p-1.5 rounded-lg bg-[#15151f] text-[10px] text-pink-300 mono font-bold">
                    ⚡ {pm.actionTaken}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Agent Memory & Lineage Stream */}
        <div className="app-card-alt p-3.5 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-extrabold text-white">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AGENT REPLACEMENT INTEL STREAM</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] pr-1">
            {evolutionLog.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                Lineage initialized at Gen 1. Waiting for evolution triggers...
              </div>
            ) : (
              evolutionLog.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-[#15151f] border border-white/5 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-purple-400 mono">GEN {log.generation} UPDATE</span>
                    <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 leading-snug">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
