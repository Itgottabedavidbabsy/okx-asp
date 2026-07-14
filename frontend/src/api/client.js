import axios from 'axios';
import { useAppStore } from '../store/appStore.js';

const client = axios.create({ baseURL: '/api', timeout: 10000 });

client.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r.data,
  (err) => {
    if (err.response?.status === 401) useAppStore.getState().logout();
    return Promise.reject(err.response?.data || { error: 'Network error' });
  }
);

export const api = {
  auth: {
    startOKX: ()            => client.get('/auth/okx/start'),
    me:       ()            => client.get('/auth/me'),
    refresh:  ()            => client.post('/auth/okx/refresh'),
  },
  agents: {
    list:    (params = {})  => client.get('/agents', { params }),
    deploy:  (body)         => client.post('/agents/deploy', body),
    my:      ()             => client.get('/agents/my'),
    pause:   (id)           => client.put(`/agents/${id}/pause`),
    links:       (agentId)          => client.get(`/agents/${agentId}/links`),
    createLink:  (agentId, body)    => client.post(`/agents/${agentId}/links`, body),
    deleteLink:  (linkId)           => client.delete(`/agents/links/${linkId}`),
  },
  signals: {
    list:    (params = {})  => client.get('/signals', { params }),
    route:   (body)         => client.post('/signals/route', body),
  },
  positions: {
    list:    ()             => client.get('/positions'),
    close:   (id)           => client.post(`/positions/${id}/close`),
  },
  backtest: {
    run:     (body)         => client.post('/backtest/run', body),
    get:     (id)           => client.get(`/backtest/${id}`),
  },
  earnings: {
    get:     ()             => client.get('/earnings'),
    withdraw:(body)         => client.post('/earnings/withdraw', body),
  },
  performance: {
    agent:   (agentId)      => client.get(`/performance/agent/${agentId}`),
    verify:  (tradeHash)    => client.get(`/performance/verify/${tradeHash}`),
  },
};
