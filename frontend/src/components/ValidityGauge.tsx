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
    <div className="bg-white border border-slate-200 rounded-xl p-4 font-sans space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500">Validity Gauge V(t)</span>
        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
          isHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {status}
        </span>
      </div>

      <div className="relative pt-1">
        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100 relative border border-slate-200/60">
          <div
            style={{ width: `${percentage}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 rounded-full ${
              isHealthy ? 'bg-blue-600' : 'bg-rose-500 animate-pulse'
            }`}
          />
          {/* Adaptive Threshold Marker */}
          <div
            style={{ left: `${thresholdPct}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
            title={`Threshold: ${threshold}`}
          />
        </div>

        <div className="flex justify-between text-xs font-mono font-semibold text-slate-500 mt-2">
          <span>0.00</span>
          <span className="text-slate-900 font-bold">τ = {threshold.toFixed(2)}</span>
          <span className={`font-bold ${isHealthy ? 'text-blue-600' : 'text-rose-600'}`}>
            {score.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
