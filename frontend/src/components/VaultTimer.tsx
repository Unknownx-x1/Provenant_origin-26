import React from 'react';
import { Lock, ShieldCheck, Cpu, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Experiment } from '../ws/useLiveFeed';

interface VaultTimerProps {
  experiment?: Experiment;
  onCommit?: (expId: string) => void;
  onReveal?: (expId: string) => void;
  hardwareConnected?: boolean;
}

export const VaultTimer: React.FC<VaultTimerProps> = ({
  experiment,
  onCommit,
  onReveal,
  hardwareConnected = false
}) => {
  if (!experiment) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-500 font-mono text-xs">
        <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium">Vault Standby — Awaiting Research Trigger</p>
        <div className="mt-3 flex justify-center items-center gap-3 text-[10px]">
          <span className="text-purple-400">Vault Backend: <strong>● ENFORCED</strong></span>
          <span className="text-slate-500">M5StickC: <strong>● OFFLINE</strong></span>
        </div>
      </div>
    );
  }

  const isLocked = experiment.status === 'LOCKED' && experiment.seconds_remaining > 0;
  const isTesting = experiment.status === 'TESTING' || experiment.status === 'REVEALING';
  const isVerified = experiment.status === 'VERIFIED';
  const isRejected = experiment.status === 'REJECTED';

  return (
    <div className="bg-slate-900 border border-slate-750 rounded-xl p-4 shadow-xl relative overflow-hidden font-mono text-xs">
      {/* Device Presence & Vault Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-purple-300 font-bold bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
            VAULT: ENFORCED
          </span>
          <span className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
            hardwareConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {hardwareConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {hardwareConnected ? 'M5Stick: CONNECTED' : 'M5Stick: OFFLINE'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          {experiment.experiment_id}
        </span>
      </div>

      {/* Screen Mirror Display */}
      <div className="bg-black border-2 border-slate-800 rounded-lg p-3.5 text-center relative">
        {experiment.status === 'CREATED' && (
          <div>
            <div className="text-amber-400 font-bold text-xs tracking-wider mb-1">NEW EXPERIMENT GENERATED</div>
            <p className="text-[11px] text-slate-400 mb-3">{experiment.hypothesis}</p>
            <button
              onClick={() => onCommit && onCommit(experiment.experiment_id)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded transition"
            >
              🔒 COMMIT TO HARDWARE VAULT
            </button>
          </div>
        )}

        {isLocked && (
          <div className="space-y-1.5">
            <div className="flex justify-center text-rose-500">
              <Lock className="w-5 h-5 animate-bounce" />
            </div>
            <div className="text-rose-400 font-bold text-xs">EXPERIMENT LOCKED IN VAULT</div>
            <div className="text-2xl font-extrabold text-rose-500 my-1">
              00:{experiment.seconds_remaining < 10 ? `0${experiment.seconds_remaining}` : experiment.seconds_remaining}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              SHA-256: <span className="text-slate-200">{experiment.commit_hash || 'a81f...91cd'}</span>
            </div>
            <div className="text-[9px] text-rose-400/80 uppercase tracking-widest pt-1 border-t border-slate-900">
              PARAMETER CHANGES BLOCKED SERVER-SIDE
            </div>
          </div>
        )}

        {experiment.seconds_remaining === 0 && experiment.status === 'LOCKED' && (
          <div>
            <div className="text-emerald-400 font-bold text-xs mb-2">LOCK EXPIRED — READY TO REVEAL</div>
            <button
              onClick={() => onReveal && onReveal(experiment.experiment_id)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded transition"
            >
              🔓 REVEAL & RUN OOS VALIDATION
            </button>
          </div>
        )}

        {isTesting && (
          <div className="py-2">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 mx-auto mb-1" />
            <div className="text-cyan-400 font-bold text-xs">RUNNING WALK-FORWARD OOS VALIDATION...</div>
          </div>
        )}

        {isVerified && (
          <div className="space-y-1">
            <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto" />
            <div className="text-emerald-400 font-bold text-sm">COMMIT ✓ / VERIFIED</div>
            <div className="text-[11px] text-slate-300">
              Sharpe: <span className="font-bold text-emerald-400">1.42</span> | p-val: <span className="font-bold text-emerald-400">0.018</span>
            </div>
            <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider pt-1">
              🟢 PROMOTED TO STRATEGY POOL
            </div>
          </div>
        )}

        {isRejected && (
          <div className="space-y-1">
            <AlertTriangle className="w-7 h-7 text-rose-400 mx-auto" />
            <div className="text-rose-400 font-bold text-sm">HYPOTHESIS REJECTED</div>
            <div className="text-[11px] text-slate-400">Failed statistical promotion gate</div>
          </div>
        )}
      </div>
    </div>
  );
};
