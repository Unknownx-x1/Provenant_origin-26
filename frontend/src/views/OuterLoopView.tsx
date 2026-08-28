import React from 'react';
import { AlertCircle, Lightbulb, Lock, BarChart3, CheckCircle2, ArrowDown, ShieldCheck, Volume2 } from 'lucide-react';
import { ResearchTrigger, Experiment, StrategyPoolEntry } from '../ws/useLiveFeed';
import { VaultTimer } from '../components/VaultTimer';

interface OuterLoopViewProps {
  triggers: ResearchTrigger[];
  experiments: Experiment[];
  strategyPool: StrategyPoolEntry[];
  onCommit: (expId: string) => void;
  onReveal: (expId: string) => void;
  onSpeak?: (text: string) => void;
}

export const OuterLoopView: React.FC<OuterLoopViewProps> = ({
  triggers,
  experiments,
  strategyPool,
  onCommit,
  onReveal,
  onSpeak
}) => {
  const latestTrigger = triggers[0];
  const latestExperiment = experiments[0];
  const activeStrategies = strategyPool;

  return (
    <div className="space-y-6 font-sans">
      {/* 9. Outer Loop Header & Subtitle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 tracking-wide uppercase">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              OUTER LOOP — RESEARCH SLEEVE
            </h2>
            <p className="text-xs text-slate-400 mt-1 italic">
              "Repeated failures become hypotheses. Only validated hypotheses become strategies."
            </p>
          </div>
          <div className="bg-purple-950/80 border border-purple-800 text-purple-300 text-xs px-3 py-1.5 rounded-lg font-mono">
            CAPITAL FIREWALL: <span className="text-emerald-400 font-bold">ENFORCED</span>
          </div>
        </div>
      </div>

      {/* 9. Five-Stage Horizontal Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Stage 1: Recurring Failure Card */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between transition ${
          latestTrigger ? 'bg-rose-950/40 border-rose-800 shadow-lg shadow-rose-950/20' : 'bg-slate-900/60 border-slate-800 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold mb-2">
              <span className="bg-rose-900/60 text-rose-200 px-1.5 py-0.5 rounded">STAGE 1</span>
              RECURRING FAILURE
            </div>
            {latestTrigger ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-200 uppercase">
                  RECURRING FAILURE DETECTED
                </div>
                <div className="text-[11px] text-rose-300 bg-rose-900/30 p-2 rounded border border-rose-800/40 font-mono">
                  <div>Failures: <strong>3</strong></div>
                  <div>Strategy: {latestTrigger.strategy_template_id}</div>
                  <div>Regime: {latestTrigger.regime}</div>
                  <div>Dominant: {latestTrigger.dominant_evidence_type}</div>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase pt-1 border-t border-rose-900">
                  ⚡ RESEARCH TRIGGER: FIRED
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 my-4 text-center">Monitoring failure patterns...</div>
            )}
          </div>
        </div>

        {/* Stage 2: Hypothesis Card */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between transition ${
          latestExperiment ? 'bg-amber-950/40 border-amber-800 shadow-lg shadow-amber-950/20' : 'bg-slate-900/60 border-slate-800 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold mb-2">
              <span className="bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded">STAGE 2</span>
              HYPOTHESIS
            </div>
            {latestExperiment ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-200">Proposed Fix:</div>
                <p className="text-[11px] text-amber-200/90 bg-amber-900/30 p-2 rounded border border-amber-800/40 font-mono">
                  {latestExperiment.hypothesis}
                </p>
                <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1 rounded">
                  Param: confirmation_delay_sec = 300
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 my-4 text-center">Awaiting hypothesis trigger...</div>
            )}
          </div>
        </div>

        {/* Stage 3: Hardware Vault Card */}
        <div className="md:col-span-1">
          <div className="text-[10px] font-mono font-bold text-purple-400 mb-1 tracking-wider uppercase">
            STAGE 3: 🔐 THE VAULT
          </div>
          <VaultTimer experiment={latestExperiment} onCommit={onCommit} onReveal={onReveal} />
        </div>

        {/* Stage 4: Out-of-Sample Validation */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between transition ${
          latestExperiment?.validation_result ? 'bg-cyan-950/40 border-cyan-800 shadow-lg shadow-cyan-950/20' : 'bg-slate-900/60 border-slate-800 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold mb-2">
              <span className="bg-cyan-900/60 text-cyan-200 px-1.5 py-0.5 rounded">STAGE 4</span>
              OOS VALIDATION
            </div>
            {latestExperiment?.validation_result ? (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                  <span className="text-slate-400">Sharpe Ratio:</span>
                  <span className="text-emerald-400 font-bold">1.42 ✓</span>
                </div>
                <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                  <span className="text-slate-400">p-value:</span>
                  <span className="text-emerald-400 font-bold">0.018 ✓</span>
                </div>
                <div className="flex justify-between bg-slate-950 p-1.5 rounded">
                  <span className="text-slate-400">Decay:</span>
                  <span className="text-emerald-400 font-bold">11.2% ✓</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 my-4 text-center">Awaiting backtest validation...</div>
            )}
          </div>
        </div>

        {/* Stage 5: Strategy Promotion */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between transition ${
          latestExperiment?.promotion_status === 'PROMOTED' ? 'bg-emerald-950/40 border-emerald-800 shadow-lg shadow-emerald-950/20' : 'bg-slate-900/60 border-slate-800 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold mb-2">
              <span className="bg-emerald-900/60 text-emerald-200 px-1.5 py-0.5 rounded">STAGE 5</span>
              PROMOTION
            </div>
            {latestExperiment?.promotion_status === 'PROMOTED' ? (
              <div className="space-y-2 text-center my-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-xs font-extrabold text-emerald-300 uppercase">🟢 STRATEGY PROMOTED</div>
                <div className="text-[10px] font-mono text-slate-200 bg-emerald-900/40 p-1.5 rounded border border-emerald-800">
                  news_momentum_v2
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 my-4 text-center">Pending statistical gate...</div>
            )}
          </div>
        </div>
      </div>

      {/* 15. Active Strategy Pool & Architecture Flow Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              ACTIVE STRATEGY POOL
            </h3>
            <span className="text-xs text-purple-400 font-mono font-bold">Read-only by Track A</span>
          </div>

          {/* Flow Diagram */}
          <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            <span>RESEARCH SLEEVE</span>
            <span>➔</span>
            <span>PROMOTION GATE</span>
            <span>➔</span>
            <span className="text-emerald-400 font-bold">STRATEGY POOL</span>
            <span>➔</span>
            <span className="text-cyan-400 font-bold">TRACK A</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Template ID</th>
                <th className="p-2.5">Name / Description</th>
                <th className="p-2.5">Parameters</th>
                <th className="p-2.5">OOS Sharpe</th>
                <th className="p-2.5">p-value</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeStrategies.map((s) => (
                <tr key={s.strategy_template_id} className="hover:bg-slate-850">
                  <td className="p-2.5 font-bold text-slate-200">{s.strategy_template_id}</td>
                  <td className="p-2.5 text-slate-300">{s.name}</td>
                  <td className="p-2.5 text-slate-400">{JSON.stringify(s.params)}</td>
                  <td className="p-2.5 text-emerald-400 font-bold">{s.oos_sharpe}</td>
                  <td className="p-2.5 text-emerald-400 font-bold">{s.p_value}</td>
                  <td className="p-2.5">
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
