import React, { useState } from 'react';
import { Play, Pause, RotateCcw, ShieldAlert, SkipForward } from 'lucide-react';
import { useLiveFeed } from '../ws/useLiveFeed';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { AgentStatusBanner } from '../components/AgentStatusBanner';
import { InnerLoopView } from './InnerLoopView';
import { LiveMarketView } from './LiveMarketView';
import { OuterLoopView } from './OuterLoopView';
import { PerformanceView } from './PerformanceView';
import { SettingsView } from './SettingsView';
import { AuditTrail } from '../components/AuditTrail';
import { ActivityFeedSidebar } from '../components/ActivityFeedSidebar';

const BACKEND_URL = 'http://127.0.0.1:8000';

export const DashboardShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { connected, hardwareConnected, decisions, triggers, experiments, strategyPool, marketTick, priceHistory, marketInterval, setMarketInterval, demoState } = useLiveFeed();


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

  const handleReset = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/demo/reset`, { method: 'POST' });
    } catch (e) {
      console.error('Reset failed', e);
    }
  };

  const handleStepPhase = async (phase?: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/demo/auto-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phase || null })
      });
      const data = await res.json();
      if (data.status === 'VAULT_LOCKED') {
        alert(`🔐 ${data.message}`);
      }
    } catch (e) {
      console.error('Step phase failed', e);
    }
  };

  const handleInjectPositiveNews = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/market/inject-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: "Apple raises Q3 guidance and beats revenue expectations",
          sentiment: "positive"
        })
      });
      await fetch(`${BACKEND_URL}/api/demo/auto-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 2 })
      });
    } catch (e) {
      console.error('Inject positive news failed', e);
    }
  };

  const handleInjectContradiction = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/market/inject-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: "Apple cuts revenue guidance amid weaker iPhone demand",
          sentiment: "negative",
          contradicts: "latest"
        })
      });
      await fetch(`${BACKEND_URL}/api/demo/auto-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 5 })
      });
    } catch (e) {
      console.error('Inject contradiction failed', e);
    }
  };

  const handleCommit = async (expId: string) => {
    try {
      await fetch(`${BACKEND_URL}/vault/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiment_id: expId, lock_duration_sec: 10 }),
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

  const latestExperiment = experiments[0];

  // Helper to render current functional view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'live_market':
        return (
          <LiveMarketView
            marketTick={marketTick}
            priceHistory={priceHistory}
            marketInterval={marketInterval}
            onSetMarketInterval={setMarketInterval}
          />
        );
      case 'decisions':
        return <AuditTrail decisions={decisions} />;
      case 'strategy':
      case 'outer':
        return (
          <OuterLoopView
            triggers={triggers}
            experiments={experiments}
            strategyPool={strategyPool}
            onCommit={handleCommit}
            onReveal={handleReveal}
            onSpeak={speakText}
            hardwareConnected={hardwareConnected}
          />
        );
      case 'performance':
        return <PerformanceView strategyPool={strategyPool} />;
      case 'settings':
        return <SettingsView demoState={demoState} />;
      case 'overview':
      case 'inner':
      default:
        return (
          <InnerLoopView
            decisions={decisions}
            marketTick={marketTick}
            priceHistory={priceHistory}
            onInjectPositiveNews={handleInjectPositiveNews}
            onInjectFailure={handleInjectContradiction}
            onSpeak={speakText}
          />
        );
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* 1. Functional Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoState={demoState}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Top Header Bar */}
        <Header
          demoState={demoState}
          connected={connected}
          hardwareConnected={hardwareConnected}
          onToggleAuto={handleStartAuto}
        />


        {/* 3. Demo Control Toolbar Bar */}
        <div className="bg-white border-b border-slate-200/80 px-8 py-3 flex flex-wrap items-center justify-between gap-4 font-sans text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 font-mono text-[11px] uppercase tracking-wider">
              Presenter Controls:
            </span>

            <button
              onClick={handleStartAuto}
              className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                demoState.autonomous_mode
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
              }`}
            >
              {demoState.autonomous_mode ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Pause Demo
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Autonomous Demo
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepPhase(5)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              ⚡ Trigger Contradiction
            </button>

            <button
              onClick={() => handleStepPhase()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 transition font-mono"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Next Phase ⏭
            </button>
          </div>
        </div>

        {/* 4. Main Body Content (Spacious & Calm Layout) */}
        <div className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-4 gap-8 items-start max-w-[1650px] mx-auto w-full">
          {/* Middle 3 Columns */}
          <div className="xl:col-span-3 space-y-8">
            {/* Agent Status Banner */}
            <AgentStatusBanner
              demoState={demoState}
              latestExperiment={latestExperiment}
            />

            {/* Active View Component */}
            {renderActiveView()}
          </div>

          {/* Right 1 Column: Activity Feed Sidebar */}
          <div className="xl:col-span-1 h-full">
            <ActivityFeedSidebar
              activityLog={demoState.activity_log}
              latestExperiment={latestExperiment}
              currentPhase={demoState.current_phase}
              onViewAll={() => setActiveTab('decisions')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
