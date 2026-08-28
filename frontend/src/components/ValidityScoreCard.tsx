import React from 'react';
import { Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { Decision } from '../ws/useLiveFeed';

interface ValidityScoreCardProps {
  decision?: Decision;
  onTriggerContradiction?: () => void;
}

export const ValidityScoreCard: React.FC<ValidityScoreCardProps> = ({
  decision,
  onTriggerContradiction
}) => {
  const validityScore = decision?.validity_score ?? 0.91;
  const threshold = decision?.validity_threshold ?? 0.60;
  const isBreached = decision ? (decision.status !== 'open' || validityScore < threshold) : false;

  // Percentage for progress slider fill
  const scorePct = Math.min(100, Math.max(0, validityScore * 100));
  const thresholdPct = Math.min(100, Math.max(0, threshold * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm font-sans space-y-6">
      {/* Top Title & Subtitle */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-base">
            <span>Decision Validity Score</span>
            <Info className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Threshold τ = {threshold.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Slider Track Gauge */}
      <div className="space-y-2">
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          {/* Progress fill (red if breached, blue/green if valid) */}
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isBreached ? 'bg-red-500' : 'bg-blue-600'
            }`}
            style={{ width: `${scorePct}%` }}
          ></div>

          {/* Threshold Vertical Marker Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
            style={{ left: `${thresholdPct}%` }}
          ></div>
        </div>

        {/* Labels below slider */}
        <div className="flex justify-between text-xs font-semibold text-slate-500 font-mono">
          <span>0.00</span>
          <span className="font-bold text-slate-900">{threshold.toFixed(2)}</span>
          <span>1.00</span>
        </div>
      </div>

      {/* Validity Breached Alert Banner (Matching exact screenshot layout) */}
      {isBreached && (
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Validity Breached – Decision Invalidated</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              0.91 ➔ <span className="text-rose-600">{validityScore.toFixed(2)}</span> &lt; {threshold.toFixed(2)}
            </div>
          </div>

          <button
            onClick={onTriggerContradiction}
            className="bg-white hover:bg-rose-50 text-rose-600 font-bold border border-rose-300 text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reverse AAPL Position
          </button>
        </div>
      )}
    </div>
  );
};
