/**
 * qr.js — Generación y visualización de QR para acceso beta
 *
 * GET  /qr/generate?phone=521234567890  → genera token + imagen QR
 * GET  /qr/scan?token=...               → valida y redirige al flujo de pago
 */

const router = require('express').Router();
const { generateQRToken } = require('../middleware/auth');

// Genera QR (solo disponible en modo beta)
router.get('/generate', (req, res) => {
  if (process.env.ACCESS_MODE !== 'qr') {
    return res.status(403).json({ error: 'QR solo disponible en modo beta (ACCESS_MODE=qr)' });
  }

  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'phone es requerido' });

  const token = generateQRToken(phone);
  const scanUrl = `${process.env.BASE_URL}/qr/scan?token=${token}`;

  // URL de QR usando la API pública de qr-server.com (sin dependencias extra)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`;

  res.json({
    token,
    scanUrl,
    qrImageUrl,
    expiresIn: '10 minutos',
    tip: 'Muestra el QR al cliente para que escanee y proceda al pago',
  });
});

// Valida el QR y redirige al flujo de pago
router.get('/scan', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Token requerido');

  // El middleware autoAuth se encargará de la validación en el redirect
  // Aquí solo redirigimos al flujo de pago con el token
  res.redirect(`${process.env.BASE_URL}/payments/start?token=${token}`);
});

module.exports = router;
