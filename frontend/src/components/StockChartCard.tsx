import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { MarketTick } from '../ws/useLiveFeed';

interface StockChartCardProps {
  marketTick?: MarketTick;
  priceHistory?: Array<{ time: string; price: number }>;
}

export const StockChartCard: React.FC<StockChartCardProps> = ({
  marketTick,
  priceHistory = []
}) => {
  const [timeframe, setTimeframe] = useState<'5s' | '10s' | '15s'>('10s');


  const price = marketTick?.price ?? 227.65;
  const changePct = marketTick?.change_pct ?? 1.18;
  const volume = marketTick?.volume ? `${(marketTick.volume / 1000000).toFixed(2)}M` : "7.45M";
  const bid = (price - 0.02).toFixed(2);
  const ask = (price + 0.02).toFixed(2);

  const defaultHistory = [
    { time: '18:52', price: 227.80 },
    { time: '18:53', price: 227.60 },
    { time: '18:54', price: 227.20 },
    { time: '18:55', price: 227.25 },
    { time: '18:56', price: 227.45 },
    { time: '18:57', price: price }
  ];

  const chartData = priceHistory.length > 0 ? priceHistory : defaultHistory;
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.floor(Math.min(...prices) - 1.0);
  const maxPrice = Math.ceil(Math.max(...prices) + 1.0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm font-sans space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Black Apple Icon Circle */}
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-xs">
            
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg">AAPL</span>
              <span className="text-xs font-semibold text-slate-500">Apple Inc.</span>
              <span className="bg-blue-50 text-blue-600 border border-blue-100 font-semibold text-[11px] px-2 py-0.5 rounded">
                Stock
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 flex-wrap font-sans text-xs">
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">${price.toFixed(2)}</div>
            <div className="text-emerald-500 font-semibold font-mono text-[11px]">+{changePct.toFixed(2)}%</div>
          </div>

          <div>
            <div className="text-slate-400 text-[10px] font-medium">Bid / Ask</div>
            <div className="font-semibold text-slate-700 font-mono">${bid} / ${ask}</div>
          </div>

          <div>
            <div className="text-slate-400 text-[10px] font-medium">Volume</div>
            <div className="font-semibold text-slate-700 font-mono">{volume}</div>
          </div>

          <span className="bg-blue-50 text-blue-600 border border-blue-100 font-semibold text-xs px-3 py-1.5 rounded-full">
            Normal Regime
          </span>

          <div className="relative inline-block">
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
              {timeframe}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Blue Gradient Line Chart */}
      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[minPrice, maxPrice]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
              formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'AAPL']}
            />
            <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#blueGradient)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
