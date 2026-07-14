import { create } from 'zustand';

const TOKEN_KEY = 'okx_asp_token';

export const useAppStore = create((set, get) => ({
  // Auth
  token:  localStorage.getItem(TOKEN_KEY) || null,
  user:   null,
  setToken: (t) => { localStorage.setItem(TOKEN_KEY, t); set({ token: t }); },
  logout:   ()  => { localStorage.removeItem(TOKEN_KEY); set({ token: null, user: null }); },

  // Prices (from OKX WebSocket)
  prices: { BTC: { v: 0, c: 0 }, ETH: { v: 0, c: 0 }, SOL: { v: 0, c: 0 } },
  orderBook: { asks: [], bids: [] },
  wssConnected: false,
  setPrices: (prices) => set({ prices }),
  setOrderBook: (ob) => set({ orderBook: ob }),

  // Agents + Deployments
  agents:      [],
  deployments: [],
  setAgents:      (agents)      => set({ agents }),
  setDeployments: (deployments) => set({ deployments }),

  // Positions
  positions: [],
  setPositions: (positions) => set({ positions }),

  // Signals
  signals: [],
  addSignal:   (s) => set((st) => ({ signals: [s, ...st.signals].slice(0, 100) })),
  setSignals:  (s) => set({ signals: s }),

  // Activity feed
  activity: [
    { color:'#00c087', text:'<strong>Grid Alpha</strong> closed 14 grid positions — net +$1,240', time:'12s' },
    { color:'#1677ff', text:'<strong>Whale Tracker</strong> detected $4.2M BTC inflow to Binance', time:'41s' },
    { color:'#f5b800', text:'<strong>Yield Optimizer</strong> migrated $82K to Pendle — +4.1% APY', time:'2m' },
  ],
  addActivity: (item) => set((st) => ({ activity: [item, ...st.activity].slice(0, 50) })),

  // Notifications (toasts)
  toasts: [],
  addToast: (t) => {
    const id = Date.now();
    set((st) => ({ toasts: [...st.toasts, { id, ...t }] }));
    setTimeout(() => set((st) => ({ toasts: st.toasts.filter((x) => x.id !== id) })), 3500);
  },

  // WebSocket
  ws: null,
  initWebSocket: () => {
    const { token, ws: existing } = get();
    if (existing) return;
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws${token ? `?token=${token}` : ''}`;
    const ws = new WebSocket(wsUrl);
    ws.onopen  = () => { set({ ws, wssConnected: true }); };
    ws.onclose = () => { set({ ws: null, wssConnected: false }); setTimeout(() => get().initWebSocket(), 5000); };
    ws.onerror = () => set({ wssConnected: false });
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const { prices } = get();
        if (msg.type === 'price_update') {
          const key = msg.pair.split('/')[0];
          set({ prices: { ...prices, [key]: { v: msg.price, c: msg.change } } });
        }
        if (msg.type === 'orderbook_update') {
          set({ orderBook: { asks: msg.data.asks || [], bids: msg.data.bids || [] } });
        }
      } catch {}
    };
    set({ ws });
  },
}));
