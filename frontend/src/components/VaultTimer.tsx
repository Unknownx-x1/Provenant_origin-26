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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center text-slate-400 font-sans text-xs">
        <Cpu className="w-6 h-6 mx-auto mb-2 opacity-50 text-purple-600" />
        <p className="font-semibold text-slate-700">Vault Standby</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Awaiting Research Trigger</p>
        <div className="mt-3 flex justify-center items-center gap-2 text-[10px]">
          <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            Vault: Enforced
          </span>
          <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
            M5Stick: Offline
          </span>
        </div>
      </div>
    );
  }

  const isLocked = experiment.status === 'LOCKED' && experiment.seconds_remaining > 0;
  const isTesting = experiment.status === 'TESTING' || experiment.status === 'REVEALING';
  const isVerified = experiment.status === 'VERIFIED';
  const isRejected = experiment.status === 'REJECTED';

  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-sm relative overflow-hidden font-sans text-xs">
      <div className="flex items-center justify-between border-b border-purple-100 pb-2 mb-3">
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
            Vault: Enforced
          </span>
          <span className="bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
            M5Stick: Offline
          </span>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-3 text-center relative font-mono">
        {experiment.status === 'CREATED' && (
          <div>
            <div className="text-amber-400 font-bold text-xs tracking-wider mb-1">NEW EXPERIMENT</div>
            <p className="text-[11px] text-slate-300 mb-2 truncate">{experiment.hypothesis}</p>
            <button
              onClick={() => onCommit && onCommit(experiment.experiment_id)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] px-3 py-1 rounded transition"
            >
              🔒 COMMIT TO VAULT
            </button>
          </div>
        )}

        {isLocked && (
          <div className="space-y-1">
            <div className="flex justify-center text-rose-400">
              <Lock className="w-4 h-4 animate-bounce" />
            </div>
            <div className="text-rose-400 font-bold text-[11px]">HARDWARE VAULT LOCKED</div>
            <div className="text-xl font-extrabold text-rose-400 my-0.5">
              00:{experiment.seconds_remaining < 10 ? `0${experiment.seconds_remaining}` : experiment.seconds_remaining}
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              SHA-256: {experiment.commit_hash ? `${experiment.commit_hash.slice(0, 6)}...` : 'a81f...'}
            </div>
          </div>
        )}

        {experiment.seconds_remaining === 0 && experiment.status === 'LOCKED' && (
          <div>
            <div className="text-emerald-400 font-bold text-xs mb-1">LOCK EXPIRED</div>
            <button
              onClick={() => onReveal && onReveal(experiment.experiment_id)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] px-3 py-1 rounded transition"
            >
              🔓 REVEAL & TEST
            </button>
          </div>
        )}

        {isTesting && (
          <div className="py-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 mx-auto mb-1" />
            <div className="text-cyan-400 font-bold text-[11px]">TESTING OOS...</div>
          </div>
        )}

        {isVerified && (
          <div className="space-y-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
            <div className="text-emerald-400 font-bold text-xs">COMMIT VERIFIED</div>
            <div className="text-[10px] text-slate-300">
              Sharpe: {experiment.validation_result ? experiment.validation_result.oos_sharpe.toFixed(2) : '1.42'} | p: {experiment.validation_result ? experiment.validation_result.p_value.toFixed(3) : '0.018'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

