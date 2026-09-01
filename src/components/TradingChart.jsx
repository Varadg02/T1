import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart2, LineChart, SlidersHorizontal, ArrowDown, ArrowUp, Repeat } from 'lucide-react';

export default function TradingChart({ symbol, marketPrices, activeStrategy, positions, onOpenManualTradeModal }) {
  const priceData = marketPrices[symbol] || { price: 3723.02, change24h: -0.73, high: 3804.17, low: 3650.00, rsi: 54 };
  const [history, setHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('Weekly');
  const [chartMode, setChartMode] = useState('bars'); // 'bars' or 'line'

  useEffect(() => {
    setHistory(prev => {
      const nextArr = [...prev, priceData.price];
      return nextArr.slice(-35);
    });
  }, [priceData.price, symbol]);

  const isUp = priceData.change24h >= 0;
  const activePosition = positions.find(p => p.symbol === symbol);

  // Generate 35 bar values for candlestick sparkline
  const bars = history.length > 5 ? history : Array.from({ length: 35 }, (_, i) => {
    const base = priceData.price;
    const noise = Math.sin(i * 0.4) * (base * 0.02) + (Math.random() - 0.5) * (base * 0.015);
    return base + noise;
  });

  const maxVal = Math.max(...bars);
  const minVal = Math.min(...bars);
  const range = maxVal - minVal || 1;

  // Format price like "$3 723.02" in screenshot
  const formattedPrice = priceData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [intPart, decPart] = formattedPrice.split('.');

  return (
    <div className="app-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Top Asset Title & Switcher */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-slate-400 text-xs font-semibold tracking-wide">
          {symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol === 'NVDA' ? 'NVIDIA Corp' : symbol === 'AAPL' ? 'Apple Inc' : symbol === 'TSLA' ? 'Tesla Inc' : 'S&P 500 ETF'} ({symbol})
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1c1c28] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer border border-white/5">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Big Price Display matching screenshot ($3 723.02) */}
      <div className="text-center my-3">
        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block mb-1">{symbol} PRICE</span>
        <div className="text-4xl md:text-5xl font-black text-white tracking-tight mono">
          ${intPart}.<span className="text-slate-300 text-3xl font-bold">{decPart}</span>
        </div>

        {/* Change Percentage Badge Pill matching screenshot */}
        <div className="mt-2.5">
          <span className={isUp ? "badge-pct-green" : "badge-pct-red"}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isUp ? '+' : ''}{priceData.change24h}% Today
          </span>
        </div>
      </div>

      {/* Timeframe & Chart Type Bar matching screenshot */}
      <div className="flex items-center justify-between my-4 px-2">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
          {['Daily', 'Weekly', 'Monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`transition-colors ${timeframe === tf ? 'text-white font-extrabold border-b-2 border-pink-500 pb-0.5' : 'hover:text-slate-200'}`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1c1c28] border border-white/5">
          <button
            onClick={() => setChartMode('bars')}
            className={`p-1.5 rounded-lg transition-all ${chartMode === 'bars' ? 'bg-[#28283a] text-pink-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartMode('line')}
            className={`p-1.5 rounded-lg transition-all ${chartMode === 'line' ? 'bg-[#28283a] text-pink-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LineChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High Point Tooltip Marker matching screenshot ($3,804.17) */}
      <div className="text-center my-1">
        <span className="text-xs font-bold text-slate-300 bg-[#1c1c28] px-3 py-1 rounded-full border border-white/5 mono inline-block shadow-lg">
          High: ${maxVal.toFixed(2)}
        </span>
      </div>

      {/* Hot Pink Sparkline / Bar Chart Container matching screenshot */}
      <div className="w-full h-[160px] my-2 relative flex items-end justify-between gap-1 px-1">
        {bars.map((val, idx) => {
          const heightPct = Math.max(12, ((val - minVal) / range) * 100);
          const isHighest = val === maxVal;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {isHighest && (
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-lg shadow-pink-500/80 mb-1 border-2 border-[#15151f] animate-ping" />
              )}
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-sm transition-all duration-300 ${
                  isHighest
                    ? 'bg-gradient-to-t from-pink-600 to-pink-400 shadow-lg shadow-pink-500/40'
                    : idx % 2 === 0
                    ? 'bg-pink-500/75 group-hover:bg-pink-400'
                    : 'bg-pink-500/40 group-hover:bg-pink-400'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Days of Week Row matching screenshot */}
      <div className="flex justify-between text-[11px] font-semibold text-slate-500 px-2 my-2 mono">
        <span>Mon</span>
        <span>Tue</span>
        <span className="text-white font-extrabold">Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>

      {/* Action Bar Dock matching screenshot bottom buttons (Buy, Sell, Exchange) */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
        <button
          onClick={onOpenManualTradeModal}
          className="app-card-alt p-3 flex flex-col items-center justify-center gap-1 hover:bg-[#252536] transition-colors group"
        >
          <ArrowDown className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-200">Buy</span>
        </button>

        <button
          onClick={onOpenManualTradeModal}
          className="app-card-alt p-3 flex flex-col items-center justify-center gap-1 hover:bg-[#252536] transition-colors group"
        >
          <ArrowUp className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-200">Sell</span>
        </button>

        <button
          onClick={onOpenManualTradeModal}
          className="app-card-alt p-3 flex flex-col items-center justify-center gap-1 hover:bg-[#252536] transition-colors group"
        >
          <Repeat className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-200">Exchange</span>
        </button>
      </div>
    </div>
  );
}
