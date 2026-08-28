import React from 'react';
import { ArrowUpDown, ShieldCheck } from 'lucide-react';
import { Decision } from '../ws/useLiveFeed';

interface AuditTrailProps {
  decisions: Decision[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ decisions }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ArrowUpDown className="w-4 h-4 text-blue-600" />
          Decision History & Audit Trail
        </div>
        <span className="text-[11px] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 font-mono">
          Auditable Ledger
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">Decision ID</th>
              <th className="p-3">Asset</th>
              <th className="p-3">Action</th>
              <th className="p-3">Validity V(t)</th>
              <th className="p-3">Threshold τ</th>
              <th className="p-3">Allocation</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {decisions.length > 0 ? (
              decisions.map((d) => (
                <tr key={d.decision_id} className="hover:bg-slate-50 transition font-mono">
                  <td className="p-3 font-bold text-slate-900">{d.decision_id}</td>
                  <td className="p-3 text-slate-700 font-bold">{d.asset}</td>
                  <td className="p-3">
                    <span className={d.action === 'BUY' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {d.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{d.validity_score.toFixed(2)}</td>
                  <td className="p-3 text-slate-600">{d.validity_threshold.toFixed(2)}</td>
                  <td className="p-3 text-slate-700 font-medium">20.0% ($20k)</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      d.status === 'open' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-400 font-sans italic">
                  No decisions logged in audit ledger yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
