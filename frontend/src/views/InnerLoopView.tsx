import React, { useState } from 'react';
import {
  Activity, ShieldAlert, Cpu, ArrowUpDown, TrendingUp, Newspaper,
  CheckCircle2, AlertTriangle, DollarSign, ShieldCheck, Zap, RefreshCw, BarChart2, Volume2, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { Decision, MarketTick } from '../ws/useLiveFeed';
import { ValidityGauge } from '../components/ValidityGauge';
import { EvidenceNodeCard } from '../components/EvidenceNodeCard';
import { AuditTrail } from '../components/AuditTrail';
import { StockMarketGraph } from '../components/StockMarketGraph';

interface InnerLoopViewProps {
  decisions: Decision[];
  marketTick?: MarketTick;
  priceHistory?: Array<{ time: string; price: number }>;
  onInjectPositiveNews: () => void;
  onInjectFailure: () => void;
  onSpeak?: (text: string) => void;
}

export const InnerLoopView: React.FC<InnerLoopViewProps> = ({
  decisions,
  marketTick,
  priceHistory = [],
  onInjectPositiveNews,
  onInjectFailure,
  onSpeak
}) => {
  const latestDecision = decisions[0];
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showWhy, setShowWhy] = useState(true);

  // Derive stage (1: SEE, 2: DECIDE, 3: MONITOR, 4: CORRECT)
  const currentStage = !latestDecision ? 1 : latestDecision.status === 'open' ? 3 : 4;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. AAPL Stock Price Chart */}
      <StockMarketGraph
        price={marketTick?.price || 228.40}
        changePct={marketTick?.change_pct || 1.18}
        volume={marketTick?.volume ? `${(marketTick.volume / 1000000).toFixed(2)}M` : "7.45M"}
        priceHistory={priceHistory}
      />

      {/* 2. Inner Loop DVE Header & 4-Stage Workflow Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Inner Loop — Decision Validity Engine (DVE)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              "Does this decision still deserve to exist right now?"
            </p>
          </div>

          {/* Direct Scenario Triggers */}
          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={onInjectPositiveNews}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-2xs transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              + Positive Signal
            </button>
            <button
              onClick={onInjectFailure}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold border border-rose-200 text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              ⚡ Contradict Signal
            </button>
          </div>
        </div>

        {/* 4 Workflow Stages */}
        <div className="grid grid-cols-4 gap-3 font-sans text-xs">
          {[
            { stage: 1, title: '1. SEE', desc: 'Observe Market & Evidence' },
            { stage: 2, title: '2. DECIDE', desc: 'Formulate Trade Setup' },
            { stage: 3, title: '3. MONITOR', desc: 'Track Validity V(t)' },
            { stage: 4, title: '4. CORRECT', desc: 'Autonomous Reversal' }
          ].map((item) => {
            const isActive = currentStage >= item.stage;
            const isCurrent = currentStage === item.stage;
            return (
              <div
                key={item.stage}
                className={`p-3.5 rounded-xl border text-center transition ${
                  isCurrent ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold shadow-2xs' :
                  isActive ? 'bg-slate-50 border-slate-200 text-slate-800' :
                  'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Decision Story Card */}
      {latestDecision ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Decision Status & Metrics Row */}
          <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Current Agent Decision
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-900 font-mono">{latestDecision.action} AAPL</span>
                <span className={`font-semibold text-xs px-3 py-1 rounded-full uppercase border ${
                  latestDecision.action === 'BUY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  Status: {latestDecision.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans font-semibold">VALIDITY V(t)</span>
                <strong className={`text-base font-bold ${latestDecision.validity_score >= latestDecision.validity_threshold ? 'text-blue-600' : 'text-rose-600'}`}>
                  {latestDecision.validity_score.toFixed(2)}
                </strong>
              </div>

              <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans font-semibold">THRESHOLD τ</span>
                <strong className="text-slate-900 text-base font-bold">{latestDecision.validity_threshold.toFixed(2)}</strong>
              </div>

              <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] block font-sans font-semibold">POSITION ALLOCATION</span>
                <strong className="text-emerald-600 text-base font-bold">$20,000 (20%)</strong>
              </div>
            </div>
          </div>

          {/* Decision Validity Score Slider Track */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-2 font-sans text-xs">
              <span className="font-bold text-slate-900">Decision Validity Score Track</span>
              <span className="text-slate-500 font-mono text-[11px]">Continuous recalculation on tick</span>
            </div>
            <ValidityGauge
              score={latestDecision.validity_score}
              threshold={latestDecision.validity_threshold}
              status={latestDecision.status}
            />
          </div>

          {/* Contradiction & Reversal Hero Banner */}
          {latestDecision.status !== 'open' && (
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-rose-700 font-bold text-base">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Decision Invalidated — Autonomous Correction Executed</span>
                </div>
                <span className="bg-white text-rose-700 font-mono text-xs px-3 py-1 rounded-full font-bold uppercase border border-rose-200">
                  Cause: Contradiction
                </span>
              </div>

              {/* 3 Step Causal Flow */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-rose-200/70 shadow-2xs">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">1. CAUSE</span>
                  <p className="text-rose-700 font-semibold mt-1">
                    {latestDecision.evidence_nodes.find(n => n.freshness !== 'FRESH')?.type || 'News Evidence'} Contradicted
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-rose-200/70 shadow-2xs">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">2. EFFECT</span>
                  <p className="text-rose-700 font-semibold mt-1">
                    Validity V(t) fell to <span className="font-bold font-mono">{latestDecision.validity_score.toFixed(2)}</span> (&lt; {latestDecision.validity_threshold.toFixed(2)} threshold)
                  </p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-rose-200/70 shadow-2xs">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase">3. ACTION</span>
                  <p className="text-emerald-700 font-bold mt-1">↻ Automatically REVERSED position to SELL {latestDecision.asset}</p>
                </div>
              </div>
            </div>
          )}

          {/* Evidence Rationale Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="flex justify-between items-center w-full font-sans text-xs font-bold text-slate-900"
            >
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Why did Provenant make this decision?
              </span>
              {showWhy ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showWhy && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans text-xs">
                  {latestDecision.evidence_nodes.map((node) => (
                    <div key={node.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase">
                        {node.type} ({Math.round(node.weight * 100)}%)
                      </div>
                      <div className={`font-bold mt-0.5 ${node.freshness === 'FRESH' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {node.freshness === 'FRESH' ? '✓ Fresh Evidence Signal' : '⚠ Evidence Penalty / Decay'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 font-sans text-xs gap-4">
                  <span className="text-slate-700 font-medium italic">
                    "{latestDecision.explanation || `I created a BUY decision based on positive news and RSI momentum. When earnings news was contradicted, validity fell below threshold and I reversed the trade.`}"
                  </span>
                  <button
                    onClick={() => onSpeak && onSpeak(latestDecision.explanation || "I reversed the position because supporting evidence was contradicted.")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    🔊 Listen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Expandable Technical Details Drawer */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex justify-between items-center w-full p-4 font-sans text-xs font-bold text-blue-600 hover:bg-slate-50 transition"
            >
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Technical Details & Mathematical Evidence Nodes
              </span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showTechnicalDetails && (
              <div className="p-5 border-t border-slate-100 space-y-4 font-sans text-xs text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Raw Evidence Nodes:</h4>
                    <div className="space-y-2">
                      {latestDecision.evidence_nodes.map((node) => (
                        <div key={node.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-900">{node.type} ({node.weight * 100}%)</div>
                            <div className="text-[10px] text-slate-500 font-mono">{node.source}</div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            node.freshness === 'FRESH' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {node.freshness}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">Risk & Capital Parameters:</h4>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">Decision ID:</span><span className="text-slate-900 font-bold">{latestDecision.decision_id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">Strategy ID:</span><span className="text-slate-900 font-bold">{latestDecision.strategy_template_id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">Risk Score:</span><span className="text-emerald-600 font-bold">0.33 (Max 0.80)</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">Capital Cap:</span><span className="text-emerald-600 font-bold">25% Max Exposure</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">Execution Slippage:</span><span className="text-slate-900 font-bold">5 bps</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-sans text-xs">
          <Cpu className="w-10 h-10 mx-auto mb-2 opacity-50 text-blue-600" />
          <p className="font-semibold text-slate-700">No Active Decision — Click "+ Positive Signal" above to simulate AAPL trade setup.</p>
        </div>
      )}

      {/* 4. Decision Audit Trail */}
      <AuditTrail decisions={decisions} />
    </div>
  );
};
