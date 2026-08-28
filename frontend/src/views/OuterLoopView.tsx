import React from 'react';
import { AlertCircle, Lightbulb, Lock, BarChart3, CheckCircle2, ArrowDown, ShieldCheck, Volume2, Cpu } from 'lucide-react';
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
  const valResult = latestExperiment?.validation_result;

  return (
    <div className="space-y-6 font-sans">
      {/* Outer Loop Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              Outer Loop — Research Sleeve & Capital Firewall
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              "Does this strategy still deserve to exist in this market regime?"
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full font-semibold">
            Capital Firewall: <span className="text-blue-600 font-bold">Enforced</span>
          </div>
        </div>
      </div>

      {/* 5 Stages */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Stage 1: Recurring Failure */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
          latestTrigger ? 'bg-rose-50/70 border-rose-200 shadow-xs' : 'bg-white border-slate-200 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold mb-2">
              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold">STAGE 1</span>
              Recurring Failure
            </div>
            {latestTrigger ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  {latestTrigger.failure_count || 3} Failures Detected
                </div>
                <div className="text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-rose-200 font-mono space-y-0.5">
                  <div>Strategy: {latestTrigger.strategy_template_id}</div>
                  <div>Regime: {latestTrigger.regime}</div>
                  <div>Dominant: {latestTrigger.dominant_evidence_type}</div>
                </div>
                <div className="text-[10px] text-emerald-600 font-bold uppercase pt-1 border-t border-rose-200">
                  ⚡ Trigger Fired
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 my-4 text-center">Monitoring failure patterns...</div>
            )}
          </div>
        </div>

        {/* Stage 2: Hypothesis */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
          latestExperiment ? 'bg-amber-50/70 border-amber-200 shadow-xs' : 'bg-white border-slate-200 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-2">
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">STAGE 2</span>
              Hypothesis
            </div>
            {latestExperiment ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">Proposed Variation:</div>
                <p className="text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-amber-200 font-mono leading-tight">
                  {latestExperiment.hypothesis}
                </p>
                <div className="text-[10px] font-mono text-slate-700 bg-amber-100/60 p-1 rounded-md text-center">
                  {Object.entries(latestExperiment.parameters || {}).map(([k, v]) => `${k} = ${v}`).join(', ') || 'confirmation_delay_sec = 300'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 my-4 text-center">Awaiting hypothesis...</div>
            )}
          </div>
        </div>

        {/* Stage 3: Hardware Vault */}
        <div className="md:col-span-1">
          <VaultTimer experiment={latestExperiment} onCommit={onCommit} onReveal={onReveal} />
        </div>

        {/* Stage 4: OOS Validation */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
          valResult ? 'bg-blue-50/70 border-blue-200 shadow-xs' : 'bg-white border-slate-200 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold mb-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold">STAGE 4</span>
              OOS Validation
            </div>
            {valResult ? (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between bg-white p-1.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500">Sharpe:</span>
                  <span className={`font-bold ${valResult.oos_sharpe >= 0.8 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {valResult.oos_sharpe.toFixed(2)} {valResult.oos_sharpe >= 0.8 ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-1.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500">p-value:</span>
                  <span className={`font-bold ${valResult.p_value <= 0.05 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {valResult.p_value.toFixed(3)} {valResult.p_value <= 0.05 ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between bg-white p-1.5 rounded-lg border border-blue-100">
                  <span className="text-slate-500">Decay:</span>
                  <span className={`font-bold ${valResult.decay <= 0.15 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {(valResult.decay * 100).toFixed(1)}% {valResult.decay <= 0.15 ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 my-4 text-center">Awaiting backtest...</div>
            )}
          </div>
        </div>

        {/* Stage 5: Strategy Promotion */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between transition ${
          latestExperiment?.promotion_status === 'PROMOTED' ? 'bg-emerald-50/70 border-emerald-200 shadow-xs' : 'bg-white border-slate-200 opacity-60'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-2">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">STAGE 5</span>
              Promotion
            </div>
            {latestExperiment?.promotion_status === 'PROMOTED' ? (
              <div className="space-y-2 text-center my-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-emerald-700 uppercase">Strategy Promoted</div>
                <div className="text-[10px] font-mono text-emerald-900 bg-white p-1.5 rounded-lg border border-emerald-200 font-bold">
                  {activeStrategies.length > 0 ? activeStrategies[activeStrategies.length - 1].strategy_template_id : 'news_momentum_v2'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 my-4 text-center">Pending gate...</div>
            )}
          </div>
        </div>
      </div>

      {/* Active Strategy Pool */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Active Strategy Pool
            </h3>
            <span className="text-xs text-slate-500 font-medium">Read-only by Track A Opportunity Generator</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600">
            <span>Research Sleeve</span>
            <span>➔</span>
            <span>Promotion Gate</span>
            <span>➔</span>
            <span className="text-blue-600 font-bold">Strategy Pool</span>
            <span>➔</span>
            <span className="text-emerald-600 font-bold">Track A</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Template ID</th>
                <th className="p-3">Name / Description</th>
                <th className="p-3">Parameters</th>
                <th className="p-3">OOS Sharpe</th>
                <th className="p-3">p-value</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {activeStrategies.map((s) => (
                <tr key={s.strategy_template_id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900">{s.strategy_template_id}</td>
                  <td className="p-3 text-slate-700 font-sans">{s.name}</td>
                  <td className="p-3 text-slate-500">{JSON.stringify(s.params)}</td>
                  <td className="p-3 text-emerald-600 font-bold">{s.oos_sharpe}</td>
                  <td className="p-3 text-emerald-600 font-bold">{s.p_value}</td>
                  <td className="p-3">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
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

