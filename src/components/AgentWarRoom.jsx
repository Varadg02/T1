import React from 'react';
import { MessageSquare, Flame, CheckCircle, ShieldCheck, Cpu } from 'lucide-react';

export default function AgentWarRoom({ debate, agents, onFireAgent }) {
  if (!debate) {
    return (
      <div className="app-card p-6 flex items-center justify-center text-slate-500 min-h-[350px]">
        <div className="text-center">
          <Cpu className="w-8 h-8 text-pink-400 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Connecting to AI Council...</p>
        </div>
      </div>
    );
  }

  const confidenceScore = debate.confidenceScore || 75;
  const decision = debate.consensusDecision || 'BUY';

  const votes = debate.agentStreams.map(s => s.vote);
  const buyCount = votes.filter(v => v === 'BUY').length;
  const sellCount = votes.filter(v => v === 'SELL').length;
  const holdCount = votes.filter(v => v === 'HOLD').length;
  const totalVotes = votes.length || 1;

  return (
    <div className="app-card p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-400" />
          <h2 className="text-sm font-extrabold text-white tracking-wide">AI AGENT WAR ROOM</h2>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-extrabold mono ${
          decision === 'BUY' ? 'badge-pct-green' :
          decision === 'SELL' ? 'badge-pct-red' :
          'bg-amber-500/15 text-amber-300 border border-amber-500/30'
        }`}>
          {decision} ({confidenceScore}%)
        </span>
      </div>

      {/* Agents Roster Row */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {agents.map((ag) => (
          <div key={ag.id} className="app-card-alt p-2.5 text-center relative group hover:border-pink-500/40 transition-all">
            <div className="text-xl mb-0.5">{ag.avatar}</div>
            <div className="text-[11px] font-extrabold text-white truncate">{ag.name.split(' ')[0]}</div>
            <div className="text-[10px] text-pink-400 mono font-bold">v{ag.version}</div>

            <button
              onClick={() => onFireAgent(ag.name.includes("Alpha") ? "AlphaNews" : ag.name.includes("Quant") ? "QuantStrat" : ag.name.includes("Risk") ? "RiskGuard" : ag.name.includes("Sent") ? "SentimentPulse" : "ExecutiveModerator")}
              title={`Fire & Replace ${ag.name}`}
              className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-1 bg-pink-600 text-white rounded-full transition-all text-[9px] shadow-lg"
            >
              🔥
            </button>
          </div>
        ))}
      </div>

      {/* Vote Consensus Gauge Bar */}
      <div className="mb-4 app-card-alt p-3">
        <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
          <span className="text-slate-400">Vote Split</span>
          <div className="flex items-center gap-3 mono">
            <span className="text-emerald-400">{buyCount} BUY</span>
            <span className="text-amber-400">{holdCount} HOLD</span>
            <span className="text-pink-400">{sellCount} SELL</span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-[#15151f] flex overflow-hidden">
          <div style={{ width: `${(buyCount / totalVotes) * 100}%` }} className="bg-emerald-400 transition-all duration-500"></div>
          <div style={{ width: `${(holdCount / totalVotes) * 100}%` }} className="bg-amber-400 transition-all duration-500"></div>
          <div style={{ width: `${(sellCount / totalVotes) * 100}%` }} className="bg-pink-500 transition-all duration-500"></div>
        </div>
      </div>

      {/* Agent Dialogue Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
        {debate.agentStreams.map((stream, idx) => (
          <div 
            key={idx} 
            className="app-card-alt p-3.5 flex items-start gap-3 hover:border-white/10 transition-all"
          >
            <div className="text-2xl p-2 rounded-xl bg-[#15151f] border border-white/5 flex-shrink-0">
              {stream.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-white">{stream.agent}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-pink-400 mono font-bold">v{stream.version}</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded mono ${
                  stream.vote === 'BUY' ? 'badge-pct-green' :
                  stream.vote === 'SELL' ? 'badge-pct-red' :
                  'bg-amber-500/20 text-amber-300'
                }`}>
                  {stream.vote}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{stream.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
