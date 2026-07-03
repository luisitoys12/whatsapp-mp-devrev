const router = require('express').Router();
const mp = require('../services/mercadopago');

router.post('/create', async (req, res) => {
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

router.get('/success', (req, res) =>
  res.json({ message: '✅ Pago exitoso', ...req.query })
);
router.get('/failure', (req, res) =>
  res.json({ message: '❌ Pago fallido', ...req.query })
);
router.get('/pending', (req, res) =>
  res.json({ message: '⏳ Pago pendiente', ...req.query })
);

module.exports = router;
