import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const clients = new Map();

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const token = new URL(req.url, 'http://x').searchParams.get('token');
    let userId = 'anonymous';
    try { userId = jwt.verify(token, config.jwt.secret).userId; } catch {}
    clients.set(ws, { userId });

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
    ws.send(JSON.stringify({ type: 'connected', userId, ts: Date.now() }));
  });

  connectToOKX(wss);
  return wss;
}

function broadcast(data, filter = null) {
  const msg = JSON.stringify(data);
  clients.forEach((meta, ws) => {
    if (ws.readyState === WebSocket.OPEN && (!filter || filter(meta))) {
      ws.send(msg);
    }
  });
}

function connectToOKX(wss) {
  let okxWs;
  function connect() {
    try {
      okxWs = new WebSocket(config.okx.wsUrl);
      okxWs.on('open', () => {
        okxWs.send(JSON.stringify({
          op: 'subscribe',
          args: [
            { channel: 'tickers', instId: 'BTC-USDT' },
            { channel: 'tickers', instId: 'ETH-USDT' },
            { channel: 'tickers', instId: 'SOL-USDT' },
            { channel: 'books5',  instId: 'BTC-USDT' },
          ],
        }));
        console.log('[WS] Connected to OKX public feed');
      });

      okxWs.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw);
          if (!msg.data || !msg.arg) return;
          const { channel, instId } = msg.arg;
          const pair = instId.replace('-', '/');
          if (channel === 'tickers') {
            const t = msg.data[0];
            broadcast({
              type:   'price_update',
              pair,
              price:  parseFloat(t.last),
              change: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h)) * 100,
              ts:     Date.now(),
            });
          }
          if (channel === 'books5') {
            broadcast({ type: 'orderbook_update', pair, data: msg.data[0], ts: Date.now() });
          }
        } catch {}
      });

      okxWs.on('close',  () => setTimeout(connect, 5000));
      okxWs.on('error',  () => setTimeout(connect, 5000));
    } catch {
      setTimeout(connect, 5000);
    }
  }
  connect();
}

export { broadcast };
