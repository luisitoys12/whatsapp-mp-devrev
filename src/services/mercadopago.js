const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

async function createPreference({ title, quantity = 1, unitPrice, phone, externalRef }) {
  const preference = new Preference(client);
  const res = await preference.create({
    body: {
      items: [{ title, quantity, unit_price: unitPrice, currency_id: 'MXN' }],
      payer: { phone: { number: phone } },
      external_reference: externalRef || `wa-${phone}-${Date.now()}`,
      notification_url: process.env.MP_NOTIFICATION_URL,
      back_urls: {
        success: `${process.env.BASE_URL}/payments/success`,
        failure: `${process.env.BASE_URL}/payments/failure`,
        pending: `${process.env.BASE_URL}/payments/pending`,
      },
      auto_return: 'approved',
    },
  });
  return { id: res.id, link: res.init_point, sandboxLink: res.sandbox_init_point };
}

async function getPayment(paymentId) {
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

module.exports = { createPreference, getPayment };
