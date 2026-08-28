import { useState, useEffect, useRef } from 'react';

export interface Decision {
  decision_id: string;
  asset: string;
  action: string;
  validity_score: number;
  validity_threshold: number;
  status: string;
  strategy_template_id: string;
  explanation?: string;
  evidence_nodes: Array<{
    id: string;
    type: string;
    weight: number;
    source: string;
    freshness: string;
    value?: any;
  }>;
}

export interface ResearchTrigger {
  trigger_id: string;
  strategy_template_id: string;
  regime: string;
  dominant_evidence_type: string;
  failure_count: number;
  narrative?: string;
}

export interface Experiment {
  experiment_id: string;
  hypothesis: string;
  strategy_template_id: string;
  parameters: Record<string, any>;
  status: string;
  commit_hash?: string;
  seconds_remaining: number;
  explanation?: string;
  validation_result?: {
    oos_sharpe: number;
    p_value: number;
    decay: number;
    is_valid: boolean;
  };
  promotion_status: string;
}

export interface StrategyPoolEntry {
  strategy_template_id: string;
  name: string;
  params: Record<string, any>;
  status: string;
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

export function useLiveFeed() {
  const [connected, setConnected] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [triggers, setTriggers] = useState<ResearchTrigger[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [strategyPool, setStrategyPool] = useState<StrategyPoolEntry[]>([]);
  const [demoState, setDemoState] = useState<DemoState>({
    current_phase: 1,
    phase_name: 'Market Observation',
    total_phases: 16,
    autonomous_mode: true,
    active_stock: 'AAPL',
    voice_enabled: true,
    activity_log: []
  });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let timerId: any = null;
    
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsUrl = `${protocol}//${host}:8000/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        timerId = setTimeout(connect, 2000);
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
            if (data.demo_state) setDemoState(data.demo_state);
          } else if (type === 'DECISION_UPDATE') {
            setDecisions((prev) => [data, ...prev.filter((d) => d.decision_id !== data.decision_id)]);
          } else if (type === 'RESEARCH_TRIGGER') {
            setTriggers((prev) => [data, ...prev]);
          } else if (type === 'EXPERIMENT_CREATED' || type === 'EXPERIMENT_UPDATE') {
            setExperiments((prev) => [data, ...prev.filter((e) => e.experiment_id !== data.experiment_id)]);
          } else if (type === 'STRATEGY_PROMOTED') {
            setStrategyPool((prev) => [data, ...prev]);
          } else if (type === 'DEMO_STATE_UPDATE') {
            setDemoState(data);
          } else if (type === 'RESET') {
            setDecisions([]);
            setTriggers([]);
            setExperiments([]);
          }
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };
    }

    connect();

    return () => {
      if (timerId) clearTimeout(timerId);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { connected, decisions, triggers, experiments, strategyPool, demoState };
}
