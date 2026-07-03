# WhatsApp + MercadoPago + DevRev on Fly.io

> Servicio Node.js que conecta WhatsApp Business API con MercadoPago y DevRev, desplegado en Fly.io.

## Flujo
```
Cliente en WhatsApp
  └─► tu servicio en Fly.io  ──► MercadoPago API  ──► link de pago
                              ◄── webhook pago aprobado
  └─► notifica al cliente por WhatsApp
  └─► crea ticket en DevRev (opcional)
```

## Deploy rápido

```bash
# 1. Instalar flyctl (si no lo tienes)
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Setear secrets
flyctl secrets set \
  WA_PHONE_NUMBER_ID="..." \
  WA_ACCESS_TOKEN="..." \
  WA_VERIFY_TOKEN="mi_token_secreto" \
  MP_ACCESS_TOKEN="TEST-..." \
  MP_NOTIFICATION_URL="https://whatsapp-mp-devrev.fly.dev/webhooks/mercadopago" \
  BASE_URL="https://whatsapp-mp-devrev.fly.dev" \
  DEVREV_TOKEN="..." \
  DEVREV_ORG_ID="..."

# 4. Deploy
flyctl deploy

# 5. Ver logs
flyctl logs
```

## Configurar webhook de WhatsApp
1. Ve a Meta for Developers → tu app → WhatsApp → Configuration
2. Callback URL: `https://whatsapp-mp-devrev.fly.dev/webhooks/whatsapp`
3. Verify token: el mismo que pusiste en `WA_VERIFY_TOKEN`
4. Suscríbete a: `messages`

## Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /webhooks/whatsapp | Verificación Meta |
| POST | /webhooks/whatsapp | Mensajes entrantes |
| POST | /webhooks/mercadopago | Notificaciones de pago |
| POST | /payments/create | Crear preferencia de pago |
| POST | /devrev/ticket | Crear ticket manual |

## Stack
- **Runtime:** Node.js 20 (Alpine)
- **Framework:** Express
- **Deploy:** Fly.io (512MB, shared CPU)
- **APIs:** WhatsApp Business, MercadoPago SDK v2, DevRev API
