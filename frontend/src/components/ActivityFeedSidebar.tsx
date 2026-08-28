import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { ActivityEntry, Experiment } from '../ws/useLiveFeed';

interface ActivityFeedSidebarProps {
  activityLog: ActivityEntry[];
  latestExperiment?: Experiment;
  currentPhase?: number;
  onViewAll?: () => void;
}

export const ActivityFeedSidebar: React.FC<ActivityFeedSidebarProps> = ({
  activityLog = [],
  latestExperiment,
  currentPhase,
  onViewAll
}) => {
  const isVaultLocked = (currentPhase === 11 || latestExperiment?.status === 'LOCKED') && (latestExperiment?.seconds_remaining ?? 0) > 0;
  const remainingSec = latestExperiment?.seconds_remaining ?? 0;

  const getBadgeStyle = (category: string, title: string) => {
    const c = category.toLowerCase();
    const t = title.toLowerCase();

    if (c === 'action' || c === 'alert' || t.includes('revers') || t.includes('breach')) {
      return { label: 'Decision', bg: 'bg-rose-100 text-rose-600 border-rose-200' };
    }
    if (c === 'alert' || t.includes('contradict') || t.includes('news')) {
      return { label: 'Evidence', bg: 'bg-blue-100 text-blue-600 border-blue-200' };
    }
    if (c === 'system' || t.includes('monitor')) {
      return { label: 'Monitor', bg: 'bg-purple-100 text-purple-600 border-purple-200' };
    }
    if (c === 'decision' || t.includes('opportunity') || t.includes('signal')) {
      return { label: 'Signal', bg: 'bg-emerald-100 text-emerald-600 border-emerald-200' };
    }
    if (c === 'research' || c === 'vault') {
      return { label: 'Vault', bg: 'bg-purple-100 text-purple-700 border-purple-300' };
    }
    return { label: 'System', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  const logs = activityLog.slice(0, 7);

  return (
    <aside className="w-80 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-full font-sans shrink-0">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Activity Feed</h3>
          <span className="text-xs font-semibold text-blue-600 font-mono">Live</span>
        </div>

        {/* Dynamic Timeline Items */}
        <div className="space-y-5">
          {/* Prominent Vault Lock Banner in Timeline when Vault is Locked */}
          {isVaultLocked && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-3.5 space-y-2 text-xs shadow-xs animate-pulse">
              <div className="flex items-center justify-between font-bold text-purple-700 font-mono">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-600" />
                  🔐 VAULT LOCK ACTIVE
                </span>
                <span className="text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200 font-extrabold">
                  00:{remainingSec < 10 ? `0${remainingSec}` : remainingSec}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-snug">
                Experiment parameters locked in hardware vault. Waiting for lock to expire before walk-forward testing.
              </p>
            </div>
          )}

          {logs.length > 0 ? (
            logs.map((item, idx) => {
              const badge = getBadgeStyle(item.category, item.title);
              return (
                <div key={idx} className="space-y-1 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px] font-medium">{item.timestamp}</span>
                  </div>
                  <div>
                    <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mb-1 ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium leading-snug">
                    {item.description}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center text-slate-400 text-xs py-10 italic font-sans">
              Waiting for live activity events...
            </div>
          )}
        </div>
      </div>

      {/* Bottom Link */}
      <div className="pt-6 text-center border-t border-slate-100 mt-6">
        <button
          onClick={onViewAll}
          className="text-blue-600 hover:text-blue-700 text-xs font-semibold inline-flex items-center gap-1 transition"
        >
          View All Activity
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
