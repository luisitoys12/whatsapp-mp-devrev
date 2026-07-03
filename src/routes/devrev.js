const router = require('express').Router();
const devrev = require('../services/devrev');

router.post('/ticket', async (req, res) => {
  const { title, body, phone, paymentId, amount } = req.body;
  try {
    const ticket = await devrev.createTicket({ title, body, phone, paymentId, amount });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
