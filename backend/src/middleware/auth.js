import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing authorization header' });
  try { req.user = jwt.verify(h.slice(7), config.jwt.secret); next(); }
  catch { res.status(401).json({ error: 'Token expired or invalid' }); }
}

export function optionalAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(h.slice(7), config.jwt.secret); } catch {}
  }
  next();
}
