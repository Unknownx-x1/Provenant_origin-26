import React from 'react';

interface ValidityGaugeProps {
  score: number;
  threshold: number;
  status: string;
}

export const ValidityGauge: React.FC<ValidityGaugeProps> = ({ score, threshold, status }) => {
  const percentage = Math.round(score * 100);
  const thresholdPct = Math.round(threshold * 100);
  const isHealthy = score >= threshold;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono text-slate-400">Validity Gauge V(t)</span>
        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
          isHealthy ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
        }`}>
          {status}
        </span>
      </div>

      <div className="relative pt-1">
        <div className="overflow-hidden h-4 text-xs flex rounded bg-slate-800 relative">
          <div
            style={{ width: `${percentage}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
              isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
            }`}
          />
          {/* Adaptive Threshold Marker */}
          <div
            style={{ left: `${thresholdPct}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            title={`Threshold: ${threshold}`}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
          <span>0.00</span>
          <span className="text-amber-400 font-bold">τ = {threshold.toFixed(2)}</span>
          <span className="font-bold text-white">{score.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
