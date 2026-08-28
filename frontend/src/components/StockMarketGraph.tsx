import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface StockMarketGraphProps {
  price?: number;
  changePct?: number;
  volume?: string;
  priceHistory?: Array<{ time: string; price: number }>;
}

export const StockMarketGraph: React.FC<StockMarketGraphProps> = ({
  price,
  changePct,
  volume,
  priceHistory = []
}) => {
  const [timeframe, setTimeframe] = useState<'5s' | '10s' | '15s'>('10s');

  const displayPrice = price ?? 228.40;
  const displayChange = changePct ?? 1.18;
  const displayVolume = volume ?? "7.45M";
  
  // Filter history based on selected timeframe
  const sliceCount = timeframe === '5s' ? 10 : timeframe === '10s' ? 20 : 30;
  const chartData = priceHistory.slice(-sliceCount);
  
  const prices = chartData.map((d) => d.price);
  const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices) - 1.0) : 225.0;
  const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices) + 1.0) : 230.0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase font-mono">
              Synthetic Stock Market
            </span>
            <span className="text-xs font-semibold text-slate-500">Mode: Paper Trading</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">AAPL — Apple Inc.</h3>
            <span className="text-2xl font-black font-mono text-slate-900">${displayPrice.toFixed(2)}</span>
            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
              displayChange >= 0
                ? 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                : 'text-rose-600 bg-rose-50 border border-rose-100'
            }`}>
              {displayChange >= 0 ? `+${displayChange.toFixed(2)}%` : `${displayChange.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Market Specs */}
        <div className="flex items-center gap-4 font-sans text-xs text-slate-600 flex-wrap">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-semibold">VOLUME</span>
            <strong className="text-slate-900 font-mono">{displayVolume}</strong>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-semibold">BID / ASK</span>
            <strong className="text-slate-900 font-mono">${(displayPrice - 0.02).toFixed(2)} / ${(displayPrice + 0.02).toFixed(2)}</strong>
          </div>
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-semibold">REGIME</span>
            <strong className="text-blue-600 font-semibold">HIGH VOLATILITY</strong>
          </div>

          {/* Timeframe Selector (5s, 10s, 15s) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            {(['5s', '10s', '15s'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-0.5 rounded transition uppercase ${
                  timeframe === tf ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* Clean White Area Chart */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="whiteBlueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[minPrice, maxPrice]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
              formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'AAPL Price']}
            />
            <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#whiteBlueGrad)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
