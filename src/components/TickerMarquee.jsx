import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TickerMarquee({ marketPrices }) {
  const list = Object.keys(marketPrices).map(sym => ({
    symbol: sym,
    ...marketPrices[sym]
  }));

  // Duplicate list to make infinite marquee loop smooth
  const marqueeItems = [...list, ...list, ...list];

  return (
    <div className="w-full overflow-hidden bg-slate-950/80 border-b border-slate-800/80 py-1.5 px-4 backdrop-blur-md">
      <div className="ticker-marquee gap-8">
        {marqueeItems.map((item, idx) => {
          const isUp = item.change24h >= 0;
          return (
            <div key={idx} className="flex items-center gap-2 text-xs font-semibold select-none">
              <span className="text-slate-300 mono font-extrabold">{item.symbol}</span>
              <span className="text-slate-100 mono">${item.price.toLocaleString()}</span>
              <span className={`flex items-center text-[10px] font-bold mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {isUp ? '+' : ''}{item.change24h}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
