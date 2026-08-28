import React from 'react';
import {
  Home, Activity, FileText, Sliders, BarChart2, Settings
} from 'lucide-react';
import { DemoState } from '../ws/useLiveFeed';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  demoState: DemoState;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  demoState
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'live_market', label: 'Live Market', icon: Activity },
    { id: 'decisions', label: 'Decisions & Audit', icon: FileText },
    { id: 'strategy', label: 'Research Strategy', icon: Sliders },
    { id: 'performance', label: 'Performance', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const progressPct = Math.round((demoState.current_phase / demoState.total_phases) * 100);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-6 min-h-screen shrink-0 font-sans">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs">
            P
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight font-mono block leading-none">
              PROVENANT
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider block mt-1 uppercase">
              Financial Agent
            </span>
          </div>
        </div>

        {/* Functional Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'overview' && activeTab === 'inner') || (item.id === 'strategy' && activeTab === 'outer');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-xs tracking-tight transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Autonomous Status Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 font-sans">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          <span>Autonomous Mode</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ON
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-900 mb-1">
            <span>Phase {demoState.current_phase} / {demoState.total_phases}</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mb-2">{demoState.phase_name}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
