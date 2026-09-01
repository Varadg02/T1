import React from 'react';
import { Newspaper, Globe } from 'lucide-react';

export default function NewsFeedPanel({ newsList }) {
  return (
    <div className="app-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-pink-400" />
          <h2 className="text-sm font-extrabold text-white tracking-wide">MARKET NEWS INTELLIGENCE</h2>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
          <span className="live-dot-pink"></span>
          Live RSS Web Feed
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 max-h-[300px] pr-1">
        {newsList.map((item) => (
          <div 
            key={item.id} 
            className="app-card-alt p-3.5 hover:border-pink-500/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {item.symbol} • {item.source}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${item.sentiment === 'Bullish' ? 'badge-pct-green' : item.sentiment === 'Bearish' ? 'badge-pct-red' : 'bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-bold'}`}>
                  {item.sentiment}
                </span>
                <span className="text-[10px] text-slate-400 mono font-bold">Impact: {(item.impact * 100).toFixed(0)}%</span>
              </div>
            </div>

            <h3 className="text-xs font-extrabold text-white leading-snug mb-1 group-hover:text-pink-300 transition-colors">
              {item.title}
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
              {item.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
