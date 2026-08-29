import React from 'react';
import { Play, Pause, Bell, Wifi, Cpu, ShieldCheck } from 'lucide-react';
import { DemoState, HardwareStatus } from '../ws/useLiveFeed';

interface HeaderProps {
  demoState: DemoState;
  connected: boolean;
  hardwareStatus: HardwareStatus;
  onToggleAuto: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  demoState,
  connected,
  hardwareStatus,
  onToggleAuto
}) => {
  return (
    <header className="flex flex-wrap justify-between items-center px-8 py-5 bg-white border-b border-slate-200/80 gap-4 font-sans shadow-2xs">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          PROVENANT Autonomous Financial Agent
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Synthetic Stock Market (AAPL) – Paper Trading Engine
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Backend Online Status */}
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border font-mono transition ${
          connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          BACKEND: {connected ? 'ONLINE' : 'OFFLINE'}
        </span>

        {/* WebSocket Live Status */}
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border font-mono transition ${
          connected ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <Wifi className="w-3 h-3" />
          WS: {connected ? 'LIVE' : 'RECONNECTING'}
        </span>

        {/* Hardware Truthful Presence Pill */}
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border font-mono ${
          hardwareStatus.connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}>
          <Cpu className={`w-3 h-3 ${hardwareStatus.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
          M5STICK: {hardwareStatus.connected ? 'ONLINE' : 'OFFLINE'}
        </span>

        {/* Vault Enforced Pill */}
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border font-mono bg-purple-50 text-purple-700 border-purple-200">
          <ShieldCheck className="w-3 h-3 text-purple-600" />
          VAULT: ENFORCED
        </span>

        {/* Phase Pill */}
        <span className="bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-1 rounded-full font-mono">
          Phase {demoState.current_phase} / {demoState.total_phases}
        </span>

        {/* Primary Blue Start Autonomous Demo Button */}
        <button
          onClick={onToggleAuto}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          {demoState.autonomous_mode ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pause Autonomous Demo
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Autonomous Demo
            </>
          )}
        </button>
      </div>
    </header>
  );
};
