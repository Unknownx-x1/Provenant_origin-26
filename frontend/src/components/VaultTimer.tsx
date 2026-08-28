import React from 'react';
import { Lock, ShieldCheck, Cpu, RefreshCw, AlertTriangle } from 'lucide-react';
import { Experiment } from '../ws/useLiveFeed';

interface VaultTimerProps {
  experiment?: Experiment;
  onCommit?: (expId: string) => void;
  onReveal?: (expId: string) => void;
}

export const VaultTimer: React.FC<VaultTimerProps> = ({ experiment, onCommit, onReveal }) => {
  if (!experiment) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-500">
        <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">Vault Standby — Awaiting Research Trigger</p>
      </div>
    );
  }

  const isLocked = experiment.status === 'LOCKED' && experiment.seconds_remaining > 0;
  const isTesting = experiment.status === 'TESTING' || experiment.status === 'REVEALING';
  const isVerified = experiment.status === 'VERIFIED';
  const isRejected = experiment.status === 'REJECTED';

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl p-5 shadow-xl relative overflow-hidden">
      {/* Device Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
            M5StickC Plus2 Mirror — Hardware Witness
          </span>
        </div>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
          {experiment.experiment_id}
        </span>
      </div>

      {/* Screen Mirror Display */}
      <div className="bg-black border-2 border-slate-800 rounded-lg p-4 font-mono text-center relative">
        {experiment.status === 'CREATED' && (
          <div>
            <div className="text-amber-400 font-bold text-sm tracking-wider mb-2">NEW EXPERIMENT GENERATED</div>
            <p className="text-xs text-slate-400 mb-4">{experiment.hypothesis}</p>
            <button
              onClick={() => onCommit && onCommit(experiment.experiment_id)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded transition"
            >
              🔒 COMMIT TO HARDWARE VAULT
            </button>
          </div>
        )}

        {isLocked && (
          <div className="space-y-2">
            <div className="flex justify-center text-rose-500 mb-1">
              <Lock className="w-6 h-6 animate-bounce" />
            </div>
            <div className="text-rose-400 font-bold text-sm">EXPERIMENT LOCKED IN VAULT</div>
            <div className="text-3xl font-extrabold text-rose-500 my-2">
              00:{experiment.seconds_remaining < 10 ? `0${experiment.seconds_remaining}` : experiment.seconds_remaining}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              HASH: <span className="text-slate-200">{experiment.commit_hash}</span>
            </div>
            <div className="text-[10px] text-rose-400/80 uppercase tracking-widest pt-1 border-t border-slate-900">
              DO NOT MODIFY PARAMS — PARAMETER TWEAKING BLOCKED SERVER-SIDE
            </div>
          </div>
        )}

        {experiment.seconds_remaining === 0 && experiment.status === 'LOCKED' && (
          <div>
            <div className="text-emerald-400 font-bold text-sm mb-2">LOCK EXPIRED — READY TO REVEAL</div>
            <button
              onClick={() => onReveal && onReveal(experiment.experiment_id)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2 rounded transition"
            >
              🔓 REVEAL & RUN BACKTEST / OOS VALIDATION
            </button>
          </div>
        )}

        {isTesting && (
          <div className="py-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
            <div className="text-cyan-400 font-bold text-sm">RUNNING WALK-FORWARD OOS VALIDATION...</div>
          </div>
        )}

        {isVerified && (
          <div className="space-y-1">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-emerald-400 font-bold text-base">COMMIT ✓ / RESULT ✓ / VERIFIED</div>
            <div className="text-xs text-slate-300">
              OOS Sharpe: <span className="font-bold text-emerald-400">{experiment.validation_result?.oos_sharpe}</span> | 
              p-value: <span className="font-bold text-emerald-400">{experiment.validation_result?.p_value}</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider pt-2">
              🟢 PROMOTED TO LIVE STRATEGY POOL
            </div>
          </div>
        )}

        {isRejected && (
          <div className="space-y-1">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <div className="text-rose-400 font-bold text-base">HYPOTHESIS REJECTED</div>
            <div className="text-xs text-slate-400">Failed statistical promotion gate criteria</div>
          </div>
        )}
      </div>
    </div>
  );
};
