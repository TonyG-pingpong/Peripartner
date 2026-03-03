# Stripe Checkout – Full testing steps

End-to-end test: frontend → Stripe Payment Link → webhook → watermarked PDF and one-time download link.

**Prerequisites**

- Node.js installed
- Stripe CLI installed and logged in: `stripe login`
- Backend `.env` configured (see [backend/README.md](../backend/README.md)), including:
  - `STRIPE_SECRET_KEY` (test key from Stripe Dashboard)
  - `STRIPE_WEBHOOK_SECRET` = the **CLI** secret from step 4 below (not the Dashboard webhook secret when testing locally)
  - `MASTER_PDF_PATH`, `BASE_URL`, etc.

---

## Step 1: Start the frontend (Terminal 1)

From the **project root** (`c:\projects\Peripartner`):

```powershell
npx serve
```

Then open in your browser: **http://localhost:3000**

(Alternatively: `python -m http.server 8080` and open http://localhost:8080)

---

## Step 2: Start the backend (Terminal 2)

```powershell
cd backend
npm start
```

You should see:

```
Peripartner backend running at http://localhost:4000
  Webhook (Stripe):  POST /api/webhook/stripe
  ...
```

---

## Step 3: Forward Stripe webhooks (Terminal 3)

The Stripe CLI connects to Stripe and forwards webhook events to your local backend. Stripe’s servers cannot reach `localhost`, so this step is required for local testing.

**Before you start:** Ensure the backend is already running (Step 2) on port 4000. The forward URL must match your backend.

**Run the command** (from any directory):

```bash
stripe listen --forward-to http://localhost:4000/api/webhook/stripe
```

**When it starts**, you should see something like:

```
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

- **Copy the webhook signing secret** (`whsec_...`) — you will put it in `STRIPE_WEBHOOK_SECRET` in Step 4. The CLI uses this secret to sign the events it forwards so your backend can verify they are genuine.
- **Leave this terminal open** for the whole test. If you close it, Stripe will no longer forward events to your machine.

**When a webhook is forwarded** (e.g. after you complete a test payment in Step 5), you will see a line in this terminal, for example:

```
2024-01-15 10:30:45   --> checkout.session.completed [evt_xxxxx]
2024-01-15 10:30:45  <--  [200] POST http://localhost:4000/api/webhook/stripe
```

- `-->` means the CLI received the event from Stripe and is sending it to your backend.
- `<-- [200]` means your backend responded with HTTP 200 (success). Any other status (e.g. 400, 500) indicates an error; check the backend terminal for details.

**Optional:** To forward only checkout events and reduce noise:

```bash
stripe listen --forward-to http://localhost:4000/api/webhook/stripe --events checkout.session.completed
```

**To stop:** Press Ctrl+C in this terminal.

---

## Step 4: Set the webhook secret (first time only)

1. Copy the **webhook signing secret** (`whsec_...`) from the Stripe CLI output.
2. In `backend\.env`, set:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Restart the backend (Terminal 2: Ctrl+C, then `npm start` again).

---

## Step 5: Run a test purchase

1. In the browser at **http://localhost:3000**, click **“Buy this”** (or open **http://localhost:3000/checkout.html**).
2. On the checkout page, click **“Pay with card (Stripe)”**.
3. On Stripe’s hosted page, use a test card:
   - **Card:** `4242 4242 4242 4242`
   - **Expiry:** any future date (e.g. 12/34)
   - **CVC:** any 3 digits
   - **Email:** any (e.g. test@example.com)
4. Complete the payment.

### Configure redirect (so Stripe returns to your site)

In your **Payment Link** settings (Stripe Dashboard → Payment Links → edit link → After payment), set the redirect URL to:

```text
http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}
```

Notes:
- `{CHECKOUT_SESSION_ID}` is a literal placeholder; Stripe replaces it automatically.
- This repo includes a success page at `success.html`. The URL above uses `/success` (no `.html`) because Stripe’s field can be picky/short. With `npx serve`, both `success.html` and `/success` typically work; if yours doesn’t, use `http://localhost:3000/success.html?session_id={CHECKOUT_SESSION_ID}`.

---

## Step 6: Verify the webhook and download

1. **Terminal 3 (Stripe CLI)**  
   You should see a line like:  
   `checkout.session.completed [evt_xxxxx]` and a 200 response.

2. **Terminal 2 (backend)**  
   No error should be logged; the webhook handler runs and creates the watermarked PDF and one-time link.

3. **Getting the download link (recommended path)**  
   If you configured the Payment Link redirect (above), Stripe will send you back to:
   `http://localhost:3000/success?session_id=cs_test_...`
   
   The success page calls the backend endpoint:
   `GET http://localhost:4000/api/stripe/fulfill?session_id=cs_test_...`
   and shows a **Download your PDF** button.

4. **Alternative: view the backend response in Stripe**  
   If you don’t use a redirect yet, Stripe won’t show your webhook response to the buyer by default. To view the JSON response (which includes `downloadUrl`):
   - Stripe Dashboard → Developers → Webhooks → select the event → view the endpoint response.

   For a quick check without the link: trigger a test event (step 7) and call the webhook manually or inspect the CLI/backend output.

4. **Optional: trigger a test event**  
   In a fourth terminal:
   ```powershell
   stripe trigger checkout.session.completed
   ```
   The CLI forwards this to your backend; you can see the webhook request/response in the CLI and backend logs. The triggered event uses Stripe’s sample data (you won’t get a real customer email in that payload unless you customize it).

---

## Quick reference – three terminals

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `npx serve` (from project root) | Frontend at http://localhost:3000 |
| 2 | `cd backend && npm start` | Backend at http://localhost:4000 |
| 3 | `stripe listen --forward-to http://localhost:4000/api/webhook/stripe` | Forward Stripe webhooks to backend |

Then open **http://localhost:3000**, go to checkout, and pay with `4242 4242 4242 4242`.

---

## Troubleshooting

- **“Webhook signature verification failed”**  
  Use the webhook secret from **Stripe CLI** (`stripe listen` output) in `STRIPE_WEBHOOK_SECRET`, not the one from Stripe Dashboard. Restart the backend after changing `.env`.

- **No webhook received**  
  Ensure Terminal 3 is running `stripe listen --forward-to ...` and that the backend is running. Stripe cannot reach `localhost` without the CLI.

- **404 or connection refused**  
  Confirm the backend is listening on port 4000 and the forward URL is `http://localhost:4000/api/webhook/stripe`.
