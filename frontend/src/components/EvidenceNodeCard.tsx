import React from 'react';
import { Newspaper, Activity, TrendingUp, Gauge } from 'lucide-react';

interface EvidenceNodeProps {
  type: string;
  weight: number;
  source: string;
  freshness: string;
}

export const EvidenceNodeCard: React.FC<EvidenceNodeProps> = ({ type, weight, source, freshness }) => {
  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'news': return <Newspaper className="w-4 h-4 text-cyan-400" />;
      case 'orderbook': return <Activity className="w-4 h-4 text-amber-400" />;
      case 'momentum': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default: return <Gauge className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-md p-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {getIcon()}
        <div>
          <div className="text-xs font-semibold text-slate-200 capitalize">{type} Evidence</div>
          <div className="text-[10px] text-slate-500 font-mono">{source}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-mono font-bold text-slate-300">{(weight * 100).toFixed(0)}%</div>
        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
          freshness === 'FRESH' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
        }`}>
          {freshness}
        </span>
      </div>
    </div>
  );
};
