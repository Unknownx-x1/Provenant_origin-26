import React, { useState } from 'react';
import { Activity, Clock, ShieldCheck, TrendingUp, BarChart2 } from 'lucide-react';
import { MarketTick } from '../ws/useLiveFeed';
import { StockMarketGraph } from '../components/StockMarketGraph';

interface LiveMarketViewProps {
  marketTick?: MarketTick;
  priceHistory?: Array<{ time: string; price: number }>;
}

export const LiveMarketView: React.FC<LiveMarketViewProps> = ({
  marketTick,
  priceHistory = []
}) => {
  const [updateInterval, setUpdateInterval] = useState<'5s' | '10s' | '30s'>('5s');

  const price = marketTick?.price ?? 228.40;
  const changePct = marketTick?.change_pct ?? 1.18;
  const volume = marketTick?.volume ? `${(marketTick.volume / 1000000).toFixed(2)}M` : "7.45M";

  return (
    <div className="space-y-8 font-sans">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Live Stock Market — AAPL
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time synthetic stock tick stream, orderbook depth, and momentum indicators.
          </p>
        </div>

        {/* Market Update Interval Selector (5s, 10s, 30s) */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-slate-500 ml-1" />
          <span className="text-xs font-semibold text-slate-600 font-mono mr-1">
            Update Interval:
          </span>
          {(['5s', '10s', '30s'] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setUpdateInterval(interval)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                updateInterval === interval
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Price Chart */}
      <StockMarketGraph
        price={price}
        changePct={changePct}
        volume={volume}
        priceHistory={priceHistory}
      />

      {/* Orderbook Depth & Market Mechanics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Bid / Ask Depth
          </h4>
          <div className="font-mono text-xs space-y-2">
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Best Bid:</span>
              <strong className="text-emerald-600 font-bold">${(price - 0.02).toFixed(2)} (5,400 shares)</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Best Ask:</span>
              <strong className="text-rose-600 font-bold">${(price + 0.02).toFixed(2)} (3,800 shares)</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Spread:</span>
              <strong className="text-slate-900">$0.04 (1.7 bps)</strong>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            RSI & Momentum
          </h4>
          <div className="font-mono text-xs space-y-2">
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">RSI (14-tick):</span>
              <strong className="text-emerald-600 font-bold">64.2 (Bullish)</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">VWAP:</span>
              <strong className="text-slate-900">${(price - 0.15).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Volatility Regime:</span>
              <strong className="text-blue-600">Normal Regime</strong>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Market Safety & Bounds
          </h4>
          <div className="font-mono text-xs space-y-2">
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Circuit Breaker:</span>
              <strong className="text-emerald-600 font-bold">Normal</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Max Position Size:</span>
              <strong className="text-slate-900">$50,000</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Paper Capital:</span>
              <strong className="text-emerald-600 font-bold">$100,000 USD</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
