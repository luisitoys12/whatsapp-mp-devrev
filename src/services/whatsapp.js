const axios = require('axios');

const BASE     = 'https://graph.facebook.com/v19.0';
const PHONE_ID = process.env.WA_PHONE_NUMBER_ID;
const TOKEN    = process.env.WA_ACCESS_TOKEN;

async function sendText(to, text) {
  const res = await axios.post(
    `${BASE}/${PHONE_ID}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  return res.data;
}

async function sendPaymentLink(to, { amount, description, link }) {
  const body =
    `💳 *Pago requerido*\n` +
    `📦 ${description}\n` +
    `💵 $${amount} MXN\n\n` +
    `👉 Paga aquí: ${link}`;
  return sendText(to, body);
}

function parseIncoming(body) {
  try {
    const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return null;
    return { from: msg.from, text: msg.text?.body || '', type: msg.type, msgId: msg.id };
  } catch { return null; }
}

module.exports = { sendText, sendPaymentLink, parseIncoming };
