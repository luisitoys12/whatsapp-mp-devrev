require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/webhooks', require('./routes/webhooks'));
app.use('/payments', require('./routes/payments'));
app.use('/devrev',   require('./routes/devrev'));
app.use('/qr',       require('./routes/qr'));      // beta QR access

app.get('/health', (req, res) => res.json({
  status: 'ok',
  mode: process.env.ACCESS_MODE || 'api',
  ts: new Date(),
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Server on :${PORT} | mode=${process.env.ACCESS_MODE || 'api'}`)
);
