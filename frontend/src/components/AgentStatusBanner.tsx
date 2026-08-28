import React from 'react';
import { ShieldCheck, Lock, Activity, RefreshCw, CheckCircle2, Cpu, AlertTriangle, Zap, FlaskConical, BarChart2 } from 'lucide-react';
import { DemoState, Experiment } from '../ws/useLiveFeed';

interface AgentStatusBannerProps {
  demoState: DemoState;
  latestExperiment?: Experiment;
}

export const AgentStatusBanner: React.FC<AgentStatusBannerProps> = ({
  demoState,
  latestExperiment
}) => {
  const phase = demoState.current_phase;
  const isLocked = (phase === 11 || latestExperiment?.status === 'LOCKED') && (latestExperiment?.seconds_remaining ?? 0) > 0;
  const remainingSec = latestExperiment?.seconds_remaining ?? 0;

  // Determine Agent Status Info based on phase & Vault state
  const getStatusConfig = () => {
    if (isLocked) {
      return {
        badge: '🔐 VAULT LOCKED',
        badgeBg: 'bg-purple-100 text-purple-700 border-purple-300',
        title: `VAULT LOCKED — ${remainingSec < 10 ? `00:0${remainingSec}` : `00:${remainingSec}`} REMAINING`,
        narrative: "Experiment parameters are cryptographically committed. Waiting for the 10-second lock to expire before walk-forward testing.",
        icon: Lock,
        isLock: true
      };

    }

    switch (phase) {
      case 1:
        return {
          badge: '🟢 OBSERVING',
          badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          title: 'OBSERVING AAPL STOCK MARKET',
          narrative: 'Provenant is continuously observing real-time synthetic stock ticks and orderbook depth.',
          icon: Activity
        };
      case 2:
      case 3:
        return {
          badge: '🟢 DECIDING',
          badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          title: 'FORMULATING AUTONOMOUS DECISION',
          narrative: 'News, RSI momentum, and orderbook signals aligned. Creating BUY trade decision.',
          icon: Zap
        };
      case 4:
        return {
          badge: '🟢 MONITORING',
          badgeBg: 'bg-blue-100 text-blue-700 border-blue-300',
          title: 'CONTINUOUS VALIDITY MONITORING',
          narrative: 'Checking live Decision Validity Score V(t) against adaptive threshold τ = 0.60.',
          icon: Activity
        };
      case 5:
      case 6:
        return {
          badge: '🔴 CORRECTING',
          badgeBg: 'bg-rose-100 text-rose-700 border-rose-300',
          title: 'AUTONOMOUS POSITION CORRECTION',
          narrative: 'Contradictory earnings guidance caused validity to drop below threshold. Reversing AAPL position.',
          icon: AlertTriangle
        };
      case 7:
      case 8:
        return {
          badge: '🟠 LEARNING',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          title: 'RECORDING FAILURE & PATTERN DETECTION',
          narrative: 'Logging FailureEvent and analyzing recurring invalidation patterns across market regimes.',
          icon: Cpu
        };
      case 9:
      case 10:
        return {
          badge: '🟣 RESEARCHING',
          badgeBg: 'bg-purple-100 text-purple-700 border-purple-300',
          title: 'INITIATING RESEARCH EXPERIMENT',
          narrative: '3 recurring failures detected in high volatility. Formulating 5-minute confirmation delay hypothesis.',
          icon: FlaskConical
        };
      case 11:
        return {
          badge: '🔐 VAULT LOCKED',
          badgeBg: 'bg-purple-100 text-purple-700 border-purple-300',
          title: 'VAULT LOCK ENFORCED',
          narrative: 'Experiment parameters committed to hardware vault. Parameters cannot be changed.',
          icon: Lock,
          isLock: true
        };
      case 12:
        return {
          badge: '🧪 BACKTESTING',
          badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
          title: 'WALK-FORWARD HISTORICAL BACKTEST',
          narrative: 'Testing committed hypothesis against historical synthetic stock market dataset.',
          icon: RefreshCw
        };
      case 13:
        return {
          badge: '📊 OOS VALIDATING',
          badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
          title: 'OUT-OF-SAMPLE VALIDATION',
          narrative: 'Evaluating walk-forward Sharpe ratio, p-value statistical significance, and performance decay.',
          icon: BarChart2
        };
      case 14:
        return {
          badge: '🟢 PROMOTION GATE',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: 'STATISTICAL PROMOTION GATE EVALUATION',
          narrative: 'Verifying promotion criteria: p < 0.05 PASS, OOS Sharpe > 0.8 PASS, Performance Decay < 15% PASS.',
          icon: CheckCircle2
        };
      case 15:
      case 16:
      default:
        return {
          badge: '🟢 STRATEGY IMPROVED',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: 'CLOSED-LOOP STRATEGY PROMOTION',
          narrative: 'Improved strategy news_momentum_v2 promoted to Strategy Pool and consumed by Track A for future decisions.',
          icon: CheckCircle2
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all font-sans ${
      config.isLock ? 'bg-purple-50/80 border-purple-200' : 'bg-white border-slate-200'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${config.badgeBg}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${config.badgeBg}`}>
                {config.badge}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500">
                PROVENANT STATUS
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5 tracking-tight">
              {config.title}
            </h3>
          </div>
        </div>

        {/* Lock Countdown Bar if Vault is Locked */}
        {config.isLock && (
          <div className="bg-white border border-purple-200 rounded-xl px-4 py-2 text-right font-mono shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              TIME REMAINING
            </span>
            <span className="text-xl font-black text-purple-700">
              00:{remainingSec < 10 ? `0${remainingSec}` : remainingSec}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 font-medium mt-3 pt-3 border-t border-slate-100/80 leading-relaxed">
        "{config.narrative}"
      </p>
    </div>
  );
};
