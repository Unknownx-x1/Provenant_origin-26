import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldAlert, Cpu, ArrowUpDown, TrendingUp, Newspaper,
  CheckCircle2, AlertTriangle, DollarSign, ShieldCheck, Zap, RefreshCw, BarChart2, Volume2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Decision } from '../ws/useLiveFeed';
import { ValidityGauge } from '../components/ValidityGauge';
import { EvidenceNodeCard } from '../components/EvidenceNodeCard';
import { AuditTrail } from '../components/AuditTrail';

interface InnerLoopViewProps {
  decisions: Decision[];
  onInjectPositiveNews: () => void;
  onInjectFailure: () => void;
  onSpeak?: (text: string) => void;
}

export const InnerLoopView: React.FC<InnerLoopViewProps> = ({
  decisions,
  onInjectPositiveNews,
  onInjectFailure,
  onSpeak
}) => {
  const latestDecision = decisions[0];

  // AAPL Stock price simulation history
  const [priceHistory, setPriceHistory] = useState([
    { time: '16:00', price: 226.50 },
    { time: '16:01', price: 226.80 },
    { time: '16:02', price: 227.10 },
    { time: '16:03', price: 227.25 },
    { time: '16:04', price: 227.40 },
    { time: '16:05', price: 227.65 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory((prev) => {
        const lastPrice = prev[prev.length - 1].price;
        const change = (Math.random() - 0.48) * 0.40;
        const newPrice = Math.round((lastPrice + change) * 100) / 100;
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return [...prev.slice(1), { time: nowStr, price: newPrice }];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentPrice = priceHistory[priceHistory.length - 1]?.price || 227.40;

  // Calculate current stage for pipeline highlighting
  const currentPipelineStage = !latestDecision ? 1 : latestDecision.status === 'open' ? 5 : 7;

  return (
    <div className="space-y-6 font-sans">
      {/* 5. Inner Loop Header & Subtitle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide">
                INNER LOOP — DECISION VALIDITY ENGINE (DVE)
              </h2>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                PAPER TRADING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 italic">
              "Provenant continuously asks: Is my decision still justified?"
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={onInjectPositiveNews}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded flex items-center gap-1 transition"
            >
              <Zap className="w-3.5 h-3.5" />
              + POSITIVE SIGNAL
            </button>
            <button
              onClick={onInjectFailure}
              className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-3 py-1.5 rounded flex items-center gap-1 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              ⚡ CONTRADICT SIGNAL
            </button>
          </div>
        </div>

        {/* 5. Horizontal Visual Pipeline Flow */}
        <div className="grid grid-cols-7 gap-1 font-mono text-[11px]">
          {[
            { step: 1, label: 'MARKET', desc: 'AAPL Stock' },
            { step: 2, label: 'EVIDENCE', desc: 'News + RSI' },
            { step: 3, label: 'OPPORTUNITY', desc: 'BUY Setup' },
            { step: 4, label: 'RISK', desc: 'Risk 0.33' },
            { step: 5, label: 'DECISION', desc: 'BUY AAPL' },
            { step: 6, label: 'VALIDITY', desc: 'V(t) Score' },
            { step: 7, label: 'ACTION', desc: 'REVERSE' }
          ].map((item) => {
            const isActive = currentPipelineStage >= item.step;
            const isCurrent = currentPipelineStage === item.step;
            return (
              <div
                key={item.step}
                className={`p-2 rounded-lg text-center border transition ${
                  isCurrent ? 'bg-emerald-950 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/40' :
                  isActive ? 'bg-slate-950 border-slate-700 text-slate-200' :
                  'bg-slate-950/40 border-slate-850 text-slate-500'
                }`}
              >
                <div className="font-bold">{item.label}</div>
                <div className="text-[9px] opacity-75">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Market Feed Widget (AAPL) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <span className="font-mono text-sm font-bold text-slate-200">
              AAPL — APPLE INC. (SYNTHETIC STOCK MARKET)
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-slate-400">Stock Price: <strong className="text-emerald-400 font-bold text-base">${currentPrice.toFixed(2)} (+1.18%)</strong></span>
            <span className="text-slate-400">Volume: <strong className="text-slate-200">7.45M</strong></span>
            <span className="text-slate-400">Bid/Ask: <strong className="text-emerald-400">$227.38 / $227.42</strong></span>
            <span className="bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded text-[10px] border border-cyan-800 font-bold">REGIME: NORMAL</span>
          </div>
        </div>

        {/* Recharts Price Graph */}
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', fontSize: '12px' }} />
              <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline Grid: Evidence, Opportunity, Risk, Capital */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Evidence Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">EVIDENCE NODES</span>
              <span className="text-[10px] font-mono text-slate-400">Weighted</span>
            </div>
            <div className="space-y-2">
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-200">NEWS (35%)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Earnings Beats</div>
                </div>
                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-800 font-bold">POSITIVE</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-200">MOMENTUM (25%)</div>
                  <div className="text-[10px] text-slate-500 font-mono">RSI &gt; 60</div>
                </div>
                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-800 font-bold">BULLISH</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-200">LIQUIDITY (25%)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Depth 2.3x</div>
                </div>
                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-800 font-bold">HEALTHY</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-200">REGIME (15%)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Volatility</div>
                </div>
                <span className="bg-cyan-950 text-cyan-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-cyan-800 font-bold">NORMAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">OPPORTUNITY</span>
              <span className="bg-amber-950 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-800 font-bold">BUY SETUP</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Strategy Template:</div>
                <div className="font-bold font-mono text-slate-200">{latestDecision?.strategy_template_id || "news_momentum_v1"}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-slate-400 text-[10px]">Evidence Alignment:</div>
                <div className="flex justify-between"><span className="text-slate-300">News:</span><span className="text-emerald-400 font-bold">✓ ALIGNED</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Momentum:</span><span className="text-emerald-400 font-bold">✓ ALIGNED</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Liquidity:</span><span className="text-emerald-400 font-bold">✓ ALIGNED</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Evaluation Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase">RISK EVALUATION</span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800 font-bold">PASSED</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Risk Score:</div>
                <div className="text-xl font-bold text-emerald-400">0.33 <span className="text-xs text-slate-500 font-normal">(Max: 0.80)</span></div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-slate-300">
                Limit: Downside risk within allowed limits.
              </div>
            </div>
          </div>
        </div>

        {/* Capital Allocation Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">CAPITAL ALLOCATION</span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800 font-bold">20% ALLOCATED</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Position Size:</div>
                <div className="text-xl font-bold text-emerald-400">$20,000 <span className="text-xs text-slate-500 font-normal">Paper Capital</span></div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-slate-300">
                Max Exposure: 25% single stock cap.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. HERO ELEMENT: DECISION VALIDITY COLLAPSE & REVERSAL */}
      {latestDecision ? (
        <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">ACTIVE POSITION:</span>
              <span className="font-mono text-base font-extrabold text-slate-100">{latestDecision.decision_id}</span>
              <span className={`font-mono text-xs font-extrabold px-3 py-1 rounded ${
                latestDecision.action === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {latestDecision.action} {latestDecision.asset}
              </span>
            </div>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded">
              Strategy: {latestDecision.strategy_template_id}
            </span>
          </div>

          {/* Large Hero Validity Component */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  DECISION VALIDITY SCORE V(t)
                </span>
                <p className="text-[11px] text-slate-500">Continuously recomputed as evidence decays or gets contradicted</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-extrabold font-mono transition-all duration-700 ${
                  latestDecision.validity_score >= latestDecision.validity_threshold ? 'text-emerald-400' : 'text-rose-500 animate-pulse'
                }`}>
                  {latestDecision.validity_score.toFixed(2)}
                </div>
                <div className="text-xs font-mono text-amber-400 font-bold mt-1">
                  THRESHOLD τ = {latestDecision.validity_threshold.toFixed(2)}
                </div>
              </div>
            </div>

            <ValidityGauge
              score={latestDecision.validity_score}
              threshold={latestDecision.validity_threshold}
              status={latestDecision.status}
            />

            {/* 6. Validity Breach Animated Banner */}
            {latestDecision.status !== 'open' && (
              <div className="mt-5 bg-rose-950/80 border-2 border-rose-600 rounded-xl p-4 text-center space-y-2 animate-bounce shadow-xl shadow-rose-950/50">
                <div className="text-rose-400 font-extrabold text-base tracking-widest uppercase flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  ⚠ VALIDITY BREACHED — DECISION INVALIDATED
                </div>
                <div className="text-xl font-mono font-extrabold text-white">
                  0.91 ➔ <span className="text-rose-400">{latestDecision.validity_score.toFixed(2)}</span> &lt; 0.60
                </div>
                <div className="inline-block bg-rose-600 text-white font-extrabold font-mono text-sm px-4 py-1.5 rounded-lg shadow">
                  ↻ AUTOMATICALLY REVERSED AAPL POSITION
                </div>
              </div>
            )}
          </div>

          {/* 7. AGENT EXPLANATION PANEL WITH LISTEN BUTTON */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase block mb-1">
                AGENT EXPLANATION (AUDITABLE LLM REASONING)
              </span>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "{latestDecision.explanation || `I reversed the AAPL position because the news evidence supporting the original BUY decision was contradicted. Decision validity fell from 0.91 to ${latestDecision.validity_score.toFixed(2)}, breaching the 0.60 threshold.`}"
              </p>
            </div>
            <button
              onClick={() => onSpeak && onSpeak(latestDecision.explanation || "I reversed the AAPL position because supporting evidence was contradicted.")}
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 font-mono"
            >
              <Volume2 className="w-4 h-4" />
              🔊 LISTEN
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
          <Cpu className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No Active Decision — Click "+ POSITIVE SIGNAL" above to simulate AAPL position creation.</p>
        </div>
      )}

      {/* Decision Audit Trail */}
      <AuditTrail decisions={decisions} />
    </div>
  );
};
