import React from 'react';
import { ArrowUpDown, ShieldCheck, Cpu } from 'lucide-react';
import { Decision } from '../ws/useLiveFeed';

interface AuditTrailProps {
  decisions: Decision[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ decisions }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl font-mono text-xs">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2 font-bold text-slate-200 uppercase">
          <ArrowUpDown className="w-4 h-4 text-cyan-400" />
          DECISION HISTORY & AUDIT TRAIL
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          AUDITABLE LEDGER
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-2.5">Decision ID</th>
              <th className="p-2.5">Asset</th>
              <th className="p-2.5">Action</th>
              <th className="p-2.5">Validity V(t)</th>
              <th className="p-2.5">Threshold τ</th>
              <th className="p-2.5">Allocation</th>
              <th className="p-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {decisions.length > 0 ? (
              decisions.map((d) => (
                <tr key={d.decision_id} className="hover:bg-slate-850">
                  <td className="p-2.5 font-bold text-slate-200">{d.decision_id}</td>
                  <td className="p-2.5 text-slate-300">{d.asset}</td>
                  <td className="p-2.5">
                    <span className={d.action === 'BUY' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {d.action}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-200">{d.validity_score.toFixed(2)}</td>
                  <td className="p-2.5 text-amber-400">{d.validity_threshold.toFixed(2)}</td>
                  <td className="p-2.5 text-slate-300">20.0% ($20k)</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.status === 'open' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-500">
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
