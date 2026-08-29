import React from 'react';
import { Activity, Clock, ShieldCheck, TrendingUp, BarChart2 } from 'lucide-react';
import { MarketNewsEvent, MarketTick } from '../ws/useLiveFeed';
import { StockMarketGraph } from '../components/StockMarketGraph';
import { MarketNewsFeed } from '../components/MarketNewsFeed';

interface LiveMarketViewProps {
  marketTick?: MarketTick;
  priceHistory?: Array<{ time: string; price: number }>;
  marketInterval?: '5s' | '10s' | '30s';
  onSetMarketInterval?: (interval: '5s' | '10s' | '30s') => void;
  marketNewsHistory?: MarketNewsEvent[];
}

export const LiveMarketView: React.FC<LiveMarketViewProps> = ({
  marketTick,
  priceHistory = [],
  marketInterval = '10s',
  onSetMarketInterval,
  marketNewsHistory = []
}) => {
  const price = marketTick?.price ?? 228.40;
  const changePct = marketTick?.change_pct ?? 1.18;
  const volume = marketTick?.volume ? `${(marketTick.volume / 1000000).toFixed(2)}M` : "7.45M";
  const bid = marketTick?.bid ?? Number((price - 0.02).toFixed(2));
  const ask = marketTick?.ask ?? Number((price + 0.02).toFixed(2));
  const spread = marketTick?.spread ?? Number((ask - bid).toFixed(2));
  const rsi = marketTick?.rsi ?? 64.2;
  const vwap = marketTick?.vwap ?? Number((price - 0.15).toFixed(2));
  const regime = marketTick?.regime ?? 'HIGH_VOLATILITY';

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
            Authoritative synthetic stock tick stream, dynamic orderbook depth, and live indicators.
          </p>
        </div>

        {/* Market Update Interval Selector (5s, 10s, 30s) */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-slate-500 ml-1" />
          <span className="text-xs font-semibold text-slate-600 font-mono mr-1">
            Market Update:
          </span>
          {(['5s', '10s', '30s'] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => onSetMarketInterval && onSetMarketInterval(interval)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                marketInterval === interval
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

      <MarketNewsFeed newsHistory={marketNewsHistory} />

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
              <strong className="text-emerald-600 font-bold">${bid.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Best Ask:</span>
              <strong className="text-rose-600 font-bold">${ask.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Spread:</span>
              <strong className="text-slate-900">${spread.toFixed(2)} ({((spread / price) * 10000).toFixed(1)} bps)</strong>
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
              <strong className={`font-bold ${rsi >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {rsi.toFixed(1)} {rsi >= 50 ? '(Bullish)' : '(Bearish)'}
              </strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">VWAP:</span>
              <strong className="text-slate-900">${vwap.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500">Volatility Regime:</span>
              <strong className="text-blue-600">{regime.replace('_', ' ')}</strong>
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
              <strong className="text-slate-900">$25,000 USD</strong>
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

