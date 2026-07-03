const router = require('express').Router();
const mp = require('../services/mercadopago');
const { autoAuth } = require('../middleware/auth');

// Iniciar pago — protegido por autoAuth (QR en beta, API key en prod)
router.get('/start', autoAuth, async (req, res) => {
  const phone = req.user?.phone || req.query.phone;
  if (!phone) return res.status(400).json({ error: 'phone requerido' });

  try {
    const pref = await mp.createPreference({
      title: req.query.title || 'Pedido',
      unitPrice: parseFloat(req.query.amount) || 100,
      phone,
      externalRef: `wa-${phone}-${Date.now()}`,
    });
    // En beta: redirige directo al checkout de MP
    if (process.env.ACCESS_MODE === 'qr') {
      return res.redirect(pref.link);
    }
    res.json(pref);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear preferencia via API (producción)
router.post('/create', autoAuth, async (req, res) => {
  const { title, unitPrice, phone, externalRef } = req.body;
  if (!title || !unitPrice || !phone) {
    return res.status(400).json({ error: 'title, unitPrice y phone son requeridos' });
  }
  try {
    const pref = await mp.createPreference({ title, unitPrice, phone, externalRef });
    res.json(pref);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/success', (req, res) => res.json({ message: '✅ Pago exitoso', ...req.query }));
router.get('/failure', (req, res) => res.json({ message: '❌ Pago fallido', ...req.query }));
router.get('/pending', (req, res) => res.json({ message: '⏳ Pago pendiente', ...req.query }));

module.exports = router;
