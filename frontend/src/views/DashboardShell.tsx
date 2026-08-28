import React, { useState } from 'react';
import {
  Activity, ShieldCheck, RefreshCw, Play, Pause, FastForward, Zap, Volume2, VolumeX, ShieldAlert, Cpu
} from 'lucide-react';
import { useLiveFeed } from '../ws/useLiveFeed';
import { InnerLoopView } from './InnerLoopView';
import { OuterLoopView } from './OuterLoopView';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const DashboardShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inner' | 'outer'>('inner');
  const { connected, decisions, triggers, experiments, strategyPool, demoState } = useLiveFeed();

  // Web Speech API fallback TTS helper
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && demoState.voice_enabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartAuto = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/demo/toggle-auto`, { method: 'POST' });
    } catch (e) {
      console.error('Toggle auto failed', e);
    }
  };

  const handleStepPhase = async (phase?: number) => {
    try {
      await fetch(`${BACKEND_URL}/api/demo/auto-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phase || null })
      });
    } catch (e) {
      console.error('Step phase failed', e);
    }
  };

  const handleToggleVoice = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/demo/voice/toggle`, { method: 'POST' });
    } catch (e) {
      console.error('Toggle voice failed', e);
    }
  };

  const handleCommit = async (expId: string) => {
    try {
      await fetch(`${BACKEND_URL}/vault/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiment_id: expId, lock_duration_sec: 0 }),
      });
    } catch (e) {
      console.error('Vault commit failed', e);
    }
  };

  const handleReveal = async (expId: string) => {
    try {
      await fetch(`${BACKEND_URL}/vault/reveal/${expId}`, { method: 'POST' });
    } catch (e) {
      console.error('Vault reveal failed', e);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/reset`, { method: 'POST' });
    } catch (e) {
      console.error('Reset failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 17. Global Top Navigation Status Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 p-2 rounded-lg font-black text-lg tracking-wider">
            PROVENANT
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-100">Autonomous Financial Agent</h1>
            <div className="text-[11px] font-mono text-amber-400 font-semibold">
              SYNTHETIC STOCK MARKET — PAPER TRADING
            </div>
          </div>
        </div>

        {/* Global Badges */}
        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <span className={`px-2.5 py-1 rounded font-bold uppercase ${
            demoState.autonomous_mode ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
          }`}>
            {demoState.autonomous_mode ? '● AUTONOMOUS' : '● DEMO OVERRIDE'}
          </span>

          <span className={`px-2.5 py-1 rounded font-bold uppercase ${
            connected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}>
            {connected ? '● WS LIVE' : '● WS OFF'}
          </span>

          <button
            onClick={handleToggleVoice}
            className={`px-2.5 py-1 rounded font-bold uppercase flex items-center gap-1.5 transition ${
              demoState.voice_enabled ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {demoState.voice_enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {demoState.voice_enabled ? 'ELEVENLABS ON' : 'VOICE OFF'}
          </button>

          <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-1 rounded font-bold uppercase">
            FIREWALL: ENFORCED
          </span>

          <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded font-bold">
            PHASE {demoState.current_phase} / 16
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('inner')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition ${
              activeTab === 'inner' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Inner Loop (DVE)
          </button>
          <button
            onClick={() => setActiveTab('outer')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition ${
              activeTab === 'outer' ? 'bg-purple-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Outer Loop (Research Sleeve)
          </button>
        </div>
      </header>

      {/* 4. Dedicated DEMO CONTROL BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            DEMO CONTROL:
          </span>
          <button
            onClick={handleStartAuto}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition ${
              demoState.autonomous_mode ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {demoState.autonomous_mode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {demoState.autonomous_mode ? 'Ⅱ PAUSE' : '▶ START AUTONOMOUS DEMO'}
          </button>

          <button
            onClick={handleReset}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ↻ RESET
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-300 text-[11px]">
          <span>Scenario: <strong className="text-emerald-400 font-bold">AAPL — News Contradiction ➔ Strategy Learning</strong></span>
          <span className="text-slate-500">|</span>
          <span>Phase {demoState.current_phase}/16: <strong className="text-cyan-400">{demoState.phase_name}</strong></span>
        </div>

        {/* Presenter Override Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Presenter Overrides:</span>
          <button
            onClick={() => handleStepPhase(5)}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2.5 py-1 rounded font-bold flex items-center gap-1 transition text-[11px]"
            title="Manual Override: Trigger Contradiction"
          >
            <Zap className="w-3 h-3 text-rose-400" />
            ⚡ TRIGGER CONTRADICTION
          </button>
          <button
            onClick={() => handleStepPhase()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded font-bold flex items-center gap-1 transition text-[11px]"
            title="Manual Override: Next Phase"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            ⏭ NEXT PHASE
          </button>
        </div>
      </div>

      {/* Main Content Area + Activity Feed Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Main Loop View */}
        <div className="lg:col-span-3">
          {activeTab === 'inner' ? (
            <InnerLoopView
              decisions={decisions}
              onInjectPositiveNews={() => handleStepPhase(2)}
              onInjectFailure={() => handleStepPhase(5)}
              onSpeak={speakText}
            />
          ) : (
            <OuterLoopView
              triggers={triggers}
              experiments={experiments}
              strategyPool={strategyPool}
              onCommit={handleCommit}
              onReveal={handleReveal}
              onSpeak={speakText}
            />
          )}
        </div>

        {/* Right 1 Column: 16. Persistent PROVENANT Activity Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[750px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200 uppercase">
              <Cpu className="w-4 h-4 text-emerald-400" />
              PROVENANT ACTIVITY FEED
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live Log</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
            {demoState.activity_log.length > 0 ? (
              demoState.activity_log.map((act, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border text-xs transition ${
                    act.category === 'action' ? 'bg-rose-950/40 border-rose-800 text-rose-200' :
                    act.category === 'decision' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' :
                    act.category === 'research' ? 'bg-purple-950/40 border-purple-800 text-purple-200' :
                    act.category === 'promotion' ? 'bg-cyan-950/40 border-cyan-800 text-cyan-200' :
                    'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-amber-400">{act.timestamp}</span>
                    <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[9px]">P{act.phase}</span>
                  </div>
                  <div className="font-bold text-slate-100">{act.title}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-tight">{act.description}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 text-center my-10">Awaiting autonomous scenario initialization...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
