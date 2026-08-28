import React, { useState } from 'react';
import { Settings, Clock, Volume2, ShieldCheck, Cpu } from 'lucide-react';
import { DemoState } from '../ws/useLiveFeed';

interface SettingsViewProps {
  demoState: DemoState;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ demoState }) => {
  const [updateInterval, setUpdateInterval] = useState<'5s' | '10s' | '30s'>('5s');
  const [voiceEnabled, setVoiceEnabled] = useState(demoState.voice_enabled);

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Agent & Market Settings
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure synthetic stock tick update frequency, voice announcements, and risk parameters.
        </p>
      </div>

      {/* 1. Market Update Interval Selector (5s, 10s, 30s) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Stock Market Update Interval</h3>
            <p className="text-xs text-slate-500 font-medium">
              Controls how frequently synthetic AAPL stock market ticks are broadcast by the backend simulator.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {(['5s', '10s', '30s'] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setUpdateInterval(interval)}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition ${
                updateInterval === interval
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Update Every {interval}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ElevenLabs Voice Announcements */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Auditable Voice Explanations</h3>
              <p className="text-xs text-slate-500 font-medium">
                Announce decision invalidations and trade reversals using ElevenLabs TTS (or browser Web Speech fallback).
              </p>
            </div>
          </div>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition ${
              voiceEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {voiceEnabled ? 'VOICE ENABLED' : 'MUTED'}
          </button>
        </div>
      </div>

      {/* 3. Decision Validity Engine Parameters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Decision Validity & Threshold Mechanics</h3>
            <p className="text-xs text-slate-500 font-medium">
              Adaptive validity threshold $\tau(t)$ scales based on live market volatility regimes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[10px] block uppercase font-sans font-semibold">NORMAL REGIME THRESHOLD</span>
            <strong className="text-slate-900 text-base font-bold">τ = 0.45</strong>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[10px] block uppercase font-sans font-semibold">HIGH VOLATILITY THRESHOLD</span>
            <strong className="text-rose-600 text-base font-bold">τ = 0.60</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
