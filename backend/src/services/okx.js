import axios from 'axios';
import { config } from '../config/index.js';

const okxHttp = (token) => axios.create({
  baseURL: config.okx.apiBase,
  headers: { Authorization: `Bearer ${token}` },
  timeout: 8000,
});

export async function getOKXPositions(token) {
  const { data } = await okxHttp(token).get('/account/positions');
  return data.data || [];
}

export async function getOKXBalance(token) {
  const { data } = await okxHttp(token).get('/account/balance');
  return data.data?.[0] || {};
}

export async function placeOKXOrder(token, { instId, side, ordType = 'market', sz }) {
  const { data } = await okxHttp(token).post('/trade/order', { instId, tdMode: 'cash', side, ordType, sz: String(sz) });
  return data.data?.[0] || {};
}

export async function getOKXTicker(instId) {
  const { data } = await axios.get(`${config.okx.apiBase}/market/ticker`, { params: { instId } });
  return data.data?.[0] || {};
}
