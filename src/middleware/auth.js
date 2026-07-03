/**
 * auth.js — Dual-mode access control
 *
 * BETA  : acceso por QR (token de sesión temporal)
 * PROD  : acceso por API Key (x-api-key header)
 *
 * Cambia el modo con la variable de entorno ACCESS_MODE=qr|api
 */

const crypto = require('crypto');

// ─── In-memory QR session store (beta) ───────────────────
// En producción esto debe moverse a Redis o Postgres
const qrSessions = new Map(); // token → { phone, expiresAt, used }

/**
 * Genera un token QR de un solo uso con expiración.
 * @param {string} phone - número del cliente
 * @param {number} ttlMs - tiempo de vida en ms (default 10 min)
 */
function generateQRToken(phone, ttlMs = 10 * 60 * 1000) {
  const token = crypto.randomBytes(24).toString('hex');
  qrSessions.set(token, {
    phone,
    expiresAt: Date.now() + ttlMs,
    used: false,
  });
  // Auto-cleanup
  setTimeout(() => qrSessions.delete(token), ttlMs + 1000);
  return token;
}

/**
 * Valida un token QR.
 * Retorna el payload si es válido, o null.
 */
function validateQRToken(token) {
  const session = qrSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) { qrSessions.delete(token); return null; }
  if (session.used) return null;
  session.used = true; // one-time use
  return session;
}

// ─── Middleware ───────────────────────────────────────────

/**
 * Beta: valida token QR desde query param ?token=...
 */
function qrAuth(req, res, next) {
  const token = req.query.token || req.headers['x-qr-token'];
  if (!token) return res.status(401).json({ error: 'QR token requerido' });

  const session = validateQRToken(token);
  if (!session) return res.status(401).json({ error: 'QR token inválido o expirado' });

  req.user = { phone: session.phone, mode: 'qr' };
  next();
}

/**
 * Producción: valida API Key desde header x-api-key
 */
function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'API Key requerida (x-api-key)' });

  // Las API keys se definen como JSON en la variable de entorno:
  // API_KEYS={"key1":"cliente_a","key2":"cliente_b"}
  let keys = {};
  try { keys = JSON.parse(process.env.API_KEYS || '{}'); } catch {}

  const client = keys[key];
  if (!client) return res.status(403).json({ error: 'API Key inválida' });

  req.user = { client, mode: 'api' };
  next();
}

/**
 * Selector automático según ACCESS_MODE env var.
 * ACCESS_MODE=qr  → usa qrAuth
 * ACCESS_MODE=api → usa apiKeyAuth
 * Sin definir      → api (default seguro)
 */
function autoAuth(req, res, next) {
  const mode = process.env.ACCESS_MODE || 'api';
  if (mode === 'qr') return qrAuth(req, res, next);
  return apiKeyAuth(req, res, next);
}

module.exports = { generateQRToken, validateQRToken, qrAuth, apiKeyAuth, autoAuth };
