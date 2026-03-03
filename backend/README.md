# Peripartner backend

Webhook → watermark PDF → one-time 24h download link. Node.js (Express + pdf-lib + Stripe).

## Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   - `PORT` – server port (default 4000).
   - `BASE_URL` – public URL of this server (e.g. `https://your-api.example.com`). Used to build download links.
   - `MASTER_PDF_PATH` – path to the master PDF (no watermark). Example: `./master/peripartner-guide.pdf`.
   - `STRIPE_SECRET_KEY` – Stripe secret API key (test or live).
   - `STRIPE_WEBHOOK_SECRET` – Stripe webhook secret for verifying events.
   - `GUMROAD_WEBHOOK_SECRET` – (optional, legacy) only if you still use Gumroad.

3. **Master PDF**
   - Place your guide PDF in `backend/master/` and name it e.g. `peripartner-guide.pdf`.
   - Or put it elsewhere and set `MASTER_PDF_PATH` to that path.

## Run

```bash
npm start
```

Development with auto-restart:

```bash
npm run dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhook/stripe` | **Stripe** webhook. Expects `checkout.session.completed` events and extracts buyer email/name. Returns `downloadUrl` and `expiresAt`. |
| POST | `/api/webhook/gumroad` | (Optional, legacy) Gumroad webhook. Body must include buyer `email` (and optionally `name`). Returns `downloadUrl` and `expiresAt`. |
| GET | `/d/:token` | One-time download. Valid 24h, single use. |
| GET | `/health` | Health check. |

## Stripe webhook (recommended)

1. In Stripe Dashboard: create a **Webhook endpoint** pointing to  
   `https://your-backend-domain.com/api/webhook/stripe`
2. Subscribe to the `checkout.session.completed` event.
3. Copy the **Webhook secret** from Stripe into `STRIPE_WEBHOOK_SECRET` in your environment.
4. On each completed Checkout Session Stripe POSTs the event. Backend:
   - Verifies the signature
   - Reads `session.customer_details.email` (and `name` if present)
   - Generates a watermarked PDF and one-time 24h download link
   - Responds with `{ success: true, downloadUrl, expiresAt }`

### Testing Stripe webhooks locally

Stripe cannot send webhooks to `localhost`. Use the **Stripe CLI** to forward events to your local server:

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli  
   Then log in: `stripe login`

2. **Start your backend** (in one terminal):
   ```bash
   cd backend && npm start
   ```

3. **Forward webhooks** (in another terminal; run from any directory):
   ```bash
   stripe listen --forward-to http://localhost:4000/api/webhook/stripe
   ```
   The CLI will print a **webhook signing secret** (e.g. `whsec_...`). **You must use this secret** when testing locally.

4. **Set the CLI secret in `.env`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx  # paste the value from "stripe listen" output
   ```
   Restart the backend after changing `.env`.

5. **Trigger a test event** (optional):
   ```bash
   stripe trigger checkout.session.completed
   ```
   Or complete a test purchase using your Stripe Payment Link (e.g. the “Pay with card” link on the checkout page). The CLI will forward the real `checkout.session.completed` event to your local server.

If the webhook returns **“Webhook signature verification failed”**, the request body was modified or `STRIPE_WEBHOOK_SECRET` does not match the secret from the same source (CLI for local, Dashboard for production).

## Gumroad webhook (optional)

Only needed if you still use Gumroad in parallel with Stripe.

## Project name

This backend is part of **Peripartner** (peripartner-backend in `package.json`).
