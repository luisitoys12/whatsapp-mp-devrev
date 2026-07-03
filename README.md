# WhatsApp + MercadoPago + DevRev on Fly.io

> Servicio Node.js dual-mode: **QR** (beta) → **API Key** (producción)

## Flujo
```
╔══════════════════════════════════════════════════════╗
║  BETA (QR)                                           ║
║  Operador genera QR → cliente escanea → pago MP      ║
╠══════════════════════════════════════════════════════╣
║  PRODUCCIÓN (API)                                    ║
║  Sistema llama /payments/create con x-api-key        ║
║  → preferencia MP → webhook pago → notifica WA       ║
╚══════════════════════════════════════════════════════╝
```

## Modo BETA — QR

### Activar
```bash
flyctl secrets set ACCESS_MODE=qr
```

### Generar QR para un cliente
```bash
curl "https://whatsapp-mp-devrev.fly.dev/qr/generate?phone=521234567890"
# Responde: { token, scanUrl, qrImageUrl, expiresIn: '10 minutos' }
```
- El QR expira en **10 minutos** y es de **un solo uso**
- Al escanearlo redirige directo al checkout de MercadoPago
- Al aprobar el pago → notifica por WhatsApp al cliente

## Modo PRODUCCIÓN — API Key

### Activar
```bash
flyctl secrets set ACCESS_MODE=api
flyctl secrets set API_KEYS='{"sk_live_abc123":"mi_sistema"}'
```

### Crear pago
```bash
curl -X POST https://whatsapp-mp-devrev.fly.dev/payments/create \
  -H "x-api-key: sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{"title":"Pedido #001","unitPrice":350,"phone":"521234567890"}'
```

## Deploy

```bash
git clone https://github.com/luisitoys12/whatsapp-mp-devrev
cd whatsapp-mp-devrev

flyctl apps create whatsapp-mp-devrev

flyctl secrets set \
  WA_PHONE_NUMBER_ID="..." \
  WA_ACCESS_TOKEN="..." \
  WA_VERIFY_TOKEN="mi_token_secreto" \
  MP_ACCESS_TOKEN="TEST-..." \
  MP_NOTIFICATION_URL="https://whatsapp-mp-devrev.fly.dev/webhooks/mercadopago" \
  BASE_URL="https://whatsapp-mp-devrev.fly.dev" \
  ACCESS_MODE="qr"

flyctl deploy
flyctl logs
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /health | — | Estado + modo activo |
| GET | /qr/generate?phone= | — | Genera QR (solo modo beta) |
| GET | /qr/scan?token= | QR | Valida y redirige al pago |
| GET | /payments/start | auto | Inicia pago (QR o API) |
| POST | /payments/create | API Key | Crear preferencia de pago |
| GET | /webhooks/whatsapp | — | Verificación Meta |
| POST | /webhooks/whatsapp | — | Mensajes entrantes |
| POST | /webhooks/mercadopago | — | Notificaciones de pago |
| POST | /devrev/ticket | — | Crear ticket manual |

## Migración beta → producción

```bash
# Solo cambiar una variable, sin tocar código
flyctl secrets set ACCESS_MODE=api
flyctl secrets set API_KEYS='{"sk_live_TU_CLAVE":"tu_sistema"}'
```
