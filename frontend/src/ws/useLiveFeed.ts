import { useState, useEffect, useRef, useCallback } from 'react';

export const DEFAULT_ACTIVITY_FEED_INTERVAL = 15000; // 15 seconds pacing for human scannability

export interface EvidenceNodeData {
  id: string;
  type: string;
  weight: number;
  source: string;
  freshness: string;
  value?: any;
  headline?: string;
  sentiment?: string;
  confidence?: number;
  impact?: string;
  status?: string;
  contradicted?: boolean;
}

export interface Decision {
  decision_id: string;
  opportunity_id: string;
  asset: string;
  action: string;
  validity_score: number;
  validity_threshold: number;
  status: string;
  strategy_template_id: string;
  allocation: number;
  created_at?: string;
  explanation?: string;
  evidence_nodes: EvidenceNodeData[];
}

export interface ResearchTrigger {
  trigger_id: string;
  strategy_template_id: string;
  regime: string;
  dominant_evidence_type: string;
  failure_count: number;
  window_sec: number;
  narrative?: string;
  timestamp?: string;
}

export interface BacktestResult {
  total_return: number;
  max_drawdown: number;
  win_rate: number;
  trades_count: number;
}

export interface ValidationResult {
  oos_sharpe: number;
  p_value: number;
  decay: number;
  is_valid: boolean;
}

export interface Experiment {
  experiment_id: string;
  hypothesis: string;
  strategy_template_id: string;
  parameters: Record<string, any>;
  dataset?: string;
  status: string;
  commit_hash?: string;
  locked_at?: string;
  lock_until?: string;
  seconds_remaining: number;
  explanation?: string;
  backtest_result?: BacktestResult;
  validation_result?: ValidationResult;
  promotion_status: string;
  created_at?: string;
}

export interface StrategyPoolEntry {
  strategy_template_id: string;
  name: string;
  params: Record<string, any>;
  status: string;
  promoted_at?: string;
  oos_sharpe: number;
  p_value: number;
}

export interface ActivityEntry {
  timestamp: string;
  title: string;
  description: string;
  category: string;
  phase: number;
}

export interface DemoState {
  current_phase: number;
  phase_name: string;
  total_phases: number;
  autonomous_mode: boolean;
  active_stock: string;
  voice_enabled: boolean;
  activity_log: ActivityEntry[];
}

export interface MarketTick {
  asset: string;
  price: number;
  change_pct: number;
  volume: number;
  bid?: number;
  ask?: number;
  spread?: number;
  rsi?: number;
  vwap?: number;
  regime?: string;
  interval_sec?: number;
  timestamp?: string;
}

export type MarketNewsSentiment = 'positive' | 'negative' | 'neutral';

export interface MarketNewsEvent {
  type?: 'news';
  headline: string;
  sentiment: MarketNewsSentiment;
  asset: string;
  timestamp: string;
  source?: string;
  contradicts?: string;
  decision_id?: string;
  confidence?: number;
  weight?: number;
  impact?: string;
  status?: string;
}

export interface HardwareStatus {
  connected: boolean;
  timeout_sec?: number;
}

const isMarketNewsEvent = (value: unknown): value is MarketNewsEvent => {
  const event = value as Partial<MarketNewsEvent> | null;
  return Boolean(
    event &&
    typeof event.headline === 'string' &&
    typeof event.asset === 'string' &&
    typeof event.timestamp === 'string' &&
    (event.sentiment === 'positive' || event.sentiment === 'negative' || event.sentiment === 'neutral')
  );
};

export function useLiveFeed() {
  const [connected, setConnected] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [triggers, setTriggers] = useState<ResearchTrigger[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [strategyPool, setStrategyPool] = useState<StrategyPoolEntry[]>([]);
  const [marketInterval, setMarketIntervalState] = useState<'5s' | '10s' | '30s'>('10s');
  const [marketNewsHistory, setMarketNewsHistory] = useState<MarketNewsEvent[]>([]);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus>({ connected: false });
  
  const [marketTick, setMarketTick] = useState<MarketTick>({
    asset: 'AAPL',
    price: 228.40,
    change_pct: 1.18,
    volume: 7450000,
    bid: 228.38,
    ask: 228.42,
    spread: 0.04,
    rsi: 64.2,
    vwap: 228.25,
    regime: 'HIGH_VOLATILITY',
    interval_sec: 10.0
  });

  const [priceHistory, setPriceHistory] = useState<Array<{ time: string; price: number }>>([
    { time: '16:00:00', price: 227.10 },
    { time: '16:01:00', price: 227.45 },
    { time: '16:02:00', price: 227.80 },
    { time: '16:03:00', price: 228.15 },
    { time: '16:04:00', price: 228.25 },
    { time: '16:05:00', price: 228.40 }
  ]);

  const [demoState, setDemoState] = useState<DemoState>({
    current_phase: 1,
    phase_name: 'Market Observation',
    total_phases: 16,
    autonomous_mode: true,
    active_stock: 'AAPL',
    voice_enabled: true,
    activity_log: []
  });

  // 15-second activity feed buffer/queue
  const activityQueueRef = useRef<ActivityEntry[]>([]);
  const displayedLogRef = useRef<ActivityEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMarketNews = useCallback((news: unknown) => {
    if (!isMarketNewsEvent(news)) return;
    setMarketNewsHistory((previous) => [
      news,
      ...previous.filter((item) => item.timestamp !== news.timestamp || item.headline !== news.headline)
    ].slice(0, 20));
  }, []);

  // Set backend authoritative market interval
  const updateMarketInterval = useCallback(async (interval: '5s' | '10s' | '30s') => {
    setMarketIntervalState(interval);
    const sec = interval === '5s' ? 5.0 : interval === '30s' ? 30.0 : 10.0;
    try {
      await fetch('http://127.0.0.1:8000/api/market/interval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval_sec: sec })
      });
    } catch (e) {
      console.warn('Failed to update backend market interval', e);
    }
  }, []);

  // Periodic release of queued activity items every DEFAULT_ACTIVITY_FEED_INTERVAL (15 seconds)
  useEffect(() => {
    const feedIntervalId = setInterval(() => {
      if (activityQueueRef.current.length > 0) {
        const nextItem = activityQueueRef.current.shift()!;
        displayedLogRef.current = [nextItem, ...displayedLogRef.current.slice(0, 40)];
        setDemoState((prev) => ({
          ...prev,
          activity_log: displayedLogRef.current
        }));
      }
    }, DEFAULT_ACTIVITY_FEED_INTERVAL);

    return () => clearInterval(feedIntervalId);
  }, []);

  const queueActivity = useCallback((entry: ActivityEntry) => {
    // Avoid duplicate immediate entries
    const isDup = activityQueueRef.current.some(e => e.title === entry.title && e.description === entry.description);
    if (!isDup) {
      activityQueueRef.current.push(entry);
    }
    // If displayed log is empty, immediately show first entry
    if (displayedLogRef.current.length === 0) {
      const first = activityQueueRef.current.shift();
      if (first) {
        displayedLogRef.current = [first];
        setDemoState((prev) => ({
          ...prev,
          activity_log: displayedLogRef.current
        }));
      }
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    
    function connect() {
      if (disposed) return;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsUrl = `${protocol}//${host}:8000/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed && wsRef.current === ws) setConnected(true);
      };
      ws.onclose = () => {
        if (disposed || wsRef.current !== ws) return;
        setConnected(false);
        reconnectTimerRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => console.warn('WebSocket error, retrying...', err);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          if (type === 'INITIAL_STATE') {
            setStrategyPool(data.active_strategies || []);
            setDecisions(data.decisions || []);
            setTriggers(data.triggers || []);
            setExperiments(data.experiments || []);
            if (data.market_tick) setMarketTick(data.market_tick);
            if (data.price_history) setPriceHistory(data.price_history);
            if (data.hardware_status && typeof data.hardware_status.connected === 'boolean') {
              setHardwareStatus(data.hardware_status);
            }
            const initialNews = Array.isArray(data.market_news_history)
              ? data.market_news_history
              : data.latest_market_news
                ? [data.latest_market_news]
                : data.market_news;
            if (Array.isArray(initialNews)) {
              setMarketNewsHistory(initialNews.filter(isMarketNewsEvent).slice(0, 20));
            }
            if (data.market_interval) {
              const intVal = data.market_interval === 5 ? '5s' : data.market_interval === 30 ? '30s' : '10s';
              setMarketIntervalState(intVal);
            }
            if (data.demo_state) {
              setDemoState(data.demo_state);
              if (data.demo_state.activity_log) {
                displayedLogRef.current = data.demo_state.activity_log;
              }
            }
          } else if (type === 'MARKET_TICK') {
            setMarketTick(data);
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setPriceHistory((prev) => [...prev.slice(-25), { time: timeStr, price: data.price }]);
          } else if (type === 'MARKET_NEWS') {
            addMarketNews(data);
          } else if (type === 'HARDWARE_STATUS' && typeof data?.connected === 'boolean') {
            setHardwareStatus(data);
          } else if (type === 'DECISION_UPDATE') {
            setDecisions((prev) => [data, ...prev.filter((d) => d.decision_id !== data.decision_id)]);
            if (data.status === 'REVERSED') {
              queueActivity({
                timestamp: new Date().toISOString(),
                title: 'Position Reversed',
                description: `Validity breached for ${data.asset} (${data.validity_score.toFixed(2)} < ${data.validity_threshold.toFixed(2)}). Position automatically reversed to SELL.`,
                category: 'action',
                phase: 6
              });
            } else if (data.status === 'OPEN') {
              queueActivity({
                timestamp: new Date().toISOString(),
                title: 'Decision Created',
                description: `BUY ${data.asset} created with validity ${data.validity_score.toFixed(2)} (strategy: ${data.strategy_template_id}).`,
                category: 'decision',
                phase: 3
              });
            }
          } else if (type === 'FAILURE_EVENT') {
            queueActivity({
              timestamp: new Date().toISOString(),
              title: 'Failure Logged',
              description: `Failure recorded for ${data.strategy_template_id} under ${data.regime} regime (${data.invalidation_cause}).`,
              category: 'failure',
              phase: 7
            });
          } else if (type === 'RESEARCH_TRIGGER') {
            setTriggers((prev) => [data, ...prev]);
            queueActivity({
              timestamp: new Date().toISOString(),
              title: 'Research Trigger Fired',
              description: `${data.failure_count} recurring failures detected for ${data.strategy_template_id}. Initiating confirmation delay experiment.`,
              category: 'research',
              phase: 9
            });
          } else if (type === 'EXPERIMENT_CREATED' || type === 'EXPERIMENT_UPDATE') {
            setExperiments((prev) => [data, ...prev.filter((e) => e.experiment_id !== data.experiment_id)]);
            if (data.status === 'LOCKED' && data.commit_hash) {
              queueActivity({
                timestamp: new Date().toISOString(),
                title: 'Vault Lock Enforced',
                description: `Experiment ${data.experiment_id} locked with SHA-256 commit ${data.commit_hash.slice(0, 8)}...`,
                category: 'vault',
                phase: 11
              });
            }
          } else if (type === 'STRATEGY_PROMOTED') {
            setStrategyPool((prev) => [data, ...prev.filter((s) => s.strategy_template_id !== data.strategy_template_id)]);
            queueActivity({
              timestamp: new Date().toISOString(),
              title: 'Strategy Promoted',
              description: `Strategy ${data.strategy_template_id} passed OOS validation (Sharpe: ${data.oos_sharpe}, p: ${data.p_value}) and promoted to pool.`,
              category: 'promotion',
              phase: 15
            });
          } else if (type === 'DEMO_STATE_UPDATE') {
            setDemoState((prev) => ({
              ...prev,
              current_phase: data.current_phase,
              phase_name: data.phase_name,
              total_phases: data.total_phases,
              autonomous_mode: data.autonomous_mode,
              active_stock: data.active_stock,
              voice_enabled: data.voice_enabled
            }));
            if (data.activity_log && data.activity_log.length > 0) {
              // Add new backend logs to throttling queue
              for (const item of data.activity_log) {
                queueActivity(item);
              }
            }
          } else if (type === 'RESET') {
            setDecisions([]);
            setTriggers([]);
            setExperiments([]);
            setMarketNewsHistory([]);
            activityQueueRef.current = [];
            displayedLogRef.current = [];
            setDemoState((prev) => ({ ...prev, activity_log: [] }));
          }
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [addMarketNews, queueActivity]);

  return {
    connected,
    decisions,
    triggers,
    experiments,
    strategyPool,
    marketTick,
    priceHistory,
    marketInterval,
    setMarketInterval: updateMarketInterval,
    demoState,
    hardwareStatus,
    latestMarketNews: marketNewsHistory[0],
    marketNewsHistory
  };
}


