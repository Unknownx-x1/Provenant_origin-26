import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Decision } from '../ws/useLiveFeed';

interface RecentDecisionsTableProps {
  decisions: Decision[];
  onViewAll?: () => void;
}

export const RecentDecisionsTable: React.FC<RecentDecisionsTableProps> = ({
  decisions,
  onViewAll
}) => {
  const latestDecisions = decisions.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm font-sans space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-900">Recent Decision</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4 font-semibold">Time</th>
              <th className="py-3 px-4 font-semibold">Asset</th>
              <th className="py-3 px-4 font-semibold">Action</th>
              <th className="py-3 px-4 font-semibold">Validity (V)</th>
              <th className="py-3 px-4 font-semibold">Threshold (τ)</th>
              <th className="py-3 px-4 font-semibold">Allocation</th>
              <th className="py-3 px-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {latestDecisions.length > 0 ? (
              latestDecisions.map((d) => {
                const isReversed = d.status === 'REVERSED' || d.validity_score < d.validity_threshold;
                const timeStr = new Date(d.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <tr key={d.decision_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 font-medium">{timeStr}</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{d.asset}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{d.action}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.validity_score.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-600">{d.validity_threshold.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">20% ($20k)</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${isReversed ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isReversed ? 'Reversed' : 'Open'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400 font-sans italic">
                  No decision logged yet. Waiting for market setup...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Link */}
      <div className="text-center pt-2">
        <button
          onClick={onViewAll}
          className="text-blue-600 hover:text-blue-700 text-xs font-semibold inline-flex items-center gap-1 transition"
        >
          View All Decisions
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
