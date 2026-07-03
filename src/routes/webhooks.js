const router = require('express').Router();
const wa     = require('../services/whatsapp');
const mp     = require('../services/mercadopago');
const devrev = require('../services/devrev');

// ─── WhatsApp Webhook Verification ───────────────────────
router.get('/whatsapp', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verificado');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ─── WhatsApp Incoming Messages ───────────────────────────
router.post('/whatsapp', async (req, res) => {
  res.sendStatus(200); // responder rápido a Meta
  const msg = wa.parseIncoming(req.body);
  if (!msg) return;

  console.log(`📩 Mensaje de ${msg.from}: "${msg.text}"`);

  if (msg.text.toLowerCase().includes('pagar')) {
    try {
      const pref = await mp.createPreference({
        title: 'Pedido desde WhatsApp',
        unitPrice: 100,
        phone: msg.from,
        externalRef: `wa-${msg.from}`,
      });
      await wa.sendPaymentLink(msg.from, {
        amount: 100,
        description: 'Pedido desde WhatsApp',
        link: pref.link,
      });
    } catch (err) {
      console.error('❌ Error generando pago:', err.message);
      await wa.sendText(msg.from, 'Hubo un problema generando tu enlace de pago. Intenta de nuevo.');
    }
  } else {
    await wa.sendText(msg.from, `Hola 👋 Escribe *pagar* para recibir tu enlace de pago.`);
  }
});

// ─── MercadoPago Webhook ──────────────────────────────────
router.post('/mercadopago', async (req, res) => {
  res.sendStatus(200);
  const dataId = req.query['data.id'] || req.body?.data?.id;
  if (!dataId) return;

  try {
    const payment = await mp.getPayment(dataId);
    console.log(`💳 Pago ${dataId}: ${payment.status}`);

    if (payment.status === 'approved') {
      const phone = payment.payer?.phone?.number;

      if (phone) {
        await wa.sendText(phone,
          `✅ *Pago aprobado* #${payment.id}\n` +
          `Monto: $${payment.transaction_amount} MXN\n` +
          `¡Gracias por tu compra! 🎉`
        );
      }

      if (process.env.DEVREV_TOKEN) {
        await devrev.createTicket({
          title: `Nuevo pedido WhatsApp - ${phone}`,
          body: `Pedido aprobado vía WhatsApp`,
          phone,
          paymentId: payment.id,
          amount: payment.transaction_amount,
        });
      }
    }
  } catch (err) {
    console.error('❌ Error procesando pago MP:', err.message);
  }
});

module.exports = router;
