const axios = require('axios');

const BASE  = 'https://api.devrev.ai';
const TOKEN = process.env.DEVREV_TOKEN;
const ORG   = process.env.DEVREV_ORG_ID;

async function createTicket({ title, body, phone, paymentId, amount }) {
  const res = await axios.post(
    `${BASE}/works.create`,
    {
      type: 'ticket',
      title,
      body: `${body}\n\n📱 WhatsApp: ${phone}\n💳 Pago #${paymentId} - $${amount} MXN`,
      applies_to_part: ORG,
    },
    { headers: { Authorization: TOKEN } }
  );
  return res.data;
}

module.exports = { createTicket };
