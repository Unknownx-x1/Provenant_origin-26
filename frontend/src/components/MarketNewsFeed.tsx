import React from 'react';
import { AlertTriangle, Clock3, Newspaper } from 'lucide-react';
import { MarketNewsEvent } from '../ws/useLiveFeed';

interface MarketNewsFeedProps {
  newsHistory: MarketNewsEvent[];
}

const sentimentStyles = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200'
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

export const MarketNewsFeed: React.FC<MarketNewsFeedProps> = ({ newsHistory }) => {
  const latestNews = newsHistory[0];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-sans">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-600" />
            Market News / Evidence Feed
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Live evidence events that explain market and decision changes.</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{newsHistory.length} recent</span>
      </div>

      {!latestNews ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
          Waiting for a market-news evidence event.
        </div>
      ) : (
        <div className="space-y-3">
          {newsHistory.slice(0, 5).map((news, index) => {
            const linkedDecision = news.decision_id || news.contradicts;
            return (
              <article key={`${news.timestamp}-${news.headline}`} className={`rounded-xl border p-4 ${index === 0 ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{news.asset}</span>
                    <span className={`font-mono text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${sentimentStyles[news.sentiment]}`}>{news.sentiment}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono"><Clock3 className="w-3 h-3" />{formatTimestamp(news.timestamp)}</span>
                </div>
                <p className="text-sm font-semibold leading-snug text-slate-900">{news.headline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span>Source: {news.source || 'Unspecified'}</span>
                  {linkedDecision && (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                      <AlertTriangle className="w-3 h-3" /> Contradicts Decision {linkedDecision}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
