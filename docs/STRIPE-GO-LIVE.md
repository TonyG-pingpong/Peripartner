# Stripe – Switching from Test mode to Live mode (real credit cards)

This guide takes you from the current **test mode** setup (test Payment Link, test card `4242 4242 4242 4242`, Stripe CLI forwarding) to **live mode**, where real customers pay with real cards.

> Important: nothing in the backend code needs to change. Stripe decides test vs live from the **API key prefix** (`sk_test_...` vs `sk_live_...`) and from which **Payment Link** the buyer used. Going live is essentially: activate your Stripe account, create live versions of the Payment Link and webhook, then put the live keys/URLs in two places.

---

## Prerequisites (one-time, on Stripe's side)

Live mode is locked until your Stripe account is **activated**. In the Stripe Dashboard, top-left toggle should switch from **Test mode** to live; if it’s greyed out, complete activation first.

To activate, Stripe will ask for:

1. **Business details** – legal name, address, website (your live site URL), product description, support email/phone.
2. **Identity verification** – for the account owner (ID document + sometimes a selfie).
3. **Bank account** – where payouts will land (IBAN/sort code/routing number depending on country).
4. **Tax info** – TIN/VAT/EIN depending on country.
5. **Statement descriptor** – the short text customers will see on their card statement (e.g. `PERIPARTNER`).

Until these are filled in and accepted, the **live** toggle won’t let you create Payment Links or webhooks.

---

## Step 1 – Switch the Dashboard to Live mode

1. Go to https://dashboard.stripe.com/.
2. In the top-left, switch the **Test mode** toggle **off** (it now says **Live mode**, no orange banner).
3. Everything you do from here on (keys, Payment Links, webhooks) is in live mode and uses real money.

You can flip back to Test mode anytime — settings in the two modes are completely separate.

---

## Step 2 – Get the live secret API key

1. In live mode: **Developers → API keys**.
2. Reveal the **Secret key**. It starts with `sk_live_...`.
3. Save it somewhere safe (you’ll set it as a production env var in Step 5). **Do not commit it to git** and do not put it in the local `backend/.env` you use for development.

> If you ever paste a live key in chat, a screenshot, or a public repo, **immediately roll it** in Dashboard → API keys.

---

## Step 3 – Create the **live** Payment Link

You currently use this test link in `checkout.html`:

```107:108:checkout.html
          <a href="https://buy.stripe.com/test_9B614m98N2OsceAdNNd7q00" class="pay-button" target="_blank" rel="noopener">
            Pay with card (Stripe)
```

You need to create the same product/price in **live mode** and produce a new link (it will look like `https://buy.stripe.com/...` without the `test_` prefix).

1. In live mode: **Product catalog → Add product**.
   - Name: *Perimenopause guide for partners*
   - Price: e.g. **US$19.99**, one-time (match what you advertise on the site).
2. **Product catalog → Payment links → New**.
   - Select the product/price you just created.
3. Click **Create link**. Copy the URL (e.g. `https://buy.stripe.com/aEU3cu5b...`).

### Configure “After payment” on the live link

This mirrors `docs/STRIPE-AFTER-PAYMENT-SETUP.md` but for the live link:

1. Open the new Payment Link → **Edit** → **After payment** tab.
2. Choose **Don’t show confirmation page – Redirect customers to your website**.
3. URL:

   ```text
   https://YOUR_FRONTEND_DOMAIN/success?session_id={CHECKOUT_SESSION_ID}
   ```

   - `YOUR_FRONTEND_DOMAIN` is your **public, HTTPS** site (e.g. `https://peripartner.com`). Do **not** use `http://localhost:3000` or an IP for live — Stripe will reject it, and real buyers can’t reach it anyway.
   - Keep `{CHECKOUT_SESSION_ID}` exactly as shown.

4. **Save**.

---

## Step 4 – Create the **live** webhook endpoint

In test mode you used the Stripe CLI (`stripe listen ...`) to forward events to `localhost`. In live mode you **don’t** use the CLI — Stripe needs a public HTTPS URL it can POST to directly.

1. Your backend must be deployed to a host reachable on the public internet over HTTPS (your `BASE_URL`, e.g. `https://api.peripartner.com`).
2. In Stripe Dashboard (live mode): **Developers → Webhooks → Add endpoint**.
3. **Endpoint URL**:

   ```text
   https://YOUR_BACKEND_DOMAIN/api/webhook/stripe
   ```

4. **Events to send**: select **`checkout.session.completed`** (only — that’s all the backend handles).
5. Click **Add endpoint**.
6. On the endpoint page, click **Signing secret → Reveal**. It starts with `whsec_...`. Copy it.

> This `whsec_...` is **different** from the one `stripe listen` printed in test mode. The CLI secret only verifies events forwarded by the CLI; the Dashboard secret verifies events Stripe sends directly to your live endpoint.

---

## Step 5 – Set the live env vars on your production backend

In your production hosting environment (Render, Fly, Railway, etc. — wherever the backend runs), set/replace these variables:

| Variable | Live value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` from Step 2 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Step 4 (Dashboard, **not** the CLI) |
| `BASE_URL` | `https://YOUR_BACKEND_DOMAIN` (HTTPS, no trailing slash) |
| `MASTER_PDF_PATH` | unchanged — the master PDF must exist on the server |
| `PORT` | whatever your host expects (often set automatically) |

Then **restart / redeploy** the backend so it picks up the new env vars.

Quick sanity check after restart:

```bash
curl https://YOUR_BACKEND_DOMAIN/health
```

should return `200 OK`.

Keep your **local** `backend/.env` on the test keys — that way local development still uses `sk_test_...` and the Stripe CLI, while production uses live.

---

## Step 6 – Point the frontend at the live Payment Link

Edit `checkout.html`, line 107, replace the test URL with the live one from Step 3:

```html
<a href="https://buy.stripe.com/YOUR_LIVE_LINK_ID" class="pay-button" target="_blank" rel="noopener">
  Pay with card (Stripe)
</a>
```

Deploy the updated frontend.

> Optional: also remove the **“Test mode”** wording anywhere on the site, and double-check the displayed price matches the live Price you created.

---

## Step 7 – Verify with one real, small purchase

Stripe doesn’t accept test cards (`4242...`) in live mode — they’ll be declined. The only reliable end-to-end check is one real transaction.

1. From a different browser/device than the Dashboard, open the live site.
2. Click **Buy this → Pay with card (Stripe)**.
3. Pay with a real card (yours). Use your real email.
4. Confirm:
   - Stripe redirects you to `https://YOUR_FRONTEND_DOMAIN/success?session_id=cs_live_...`.
   - The success page shows **Download your PDF** and the download works.
   - In Stripe Dashboard (live): **Payments** shows the charge, **Developers → Webhooks → your endpoint** shows the `checkout.session.completed` delivery as **200 OK**.
5. **Refund yourself**: Dashboard → that Payment → **Refund** → full amount. Stripe will refund the charge; the small Stripe fee on a refund is typically a few cents depending on country.

If anything in step 4 fails, see *Troubleshooting* below before going public.

---

## Step 8 – Stop using the Stripe CLI for production

- `stripe listen --forward-to ...` is only for local/test mode.
- **Do not** set `STRIPE_WEBHOOK_SECRET` in production to the CLI’s `whsec_...` — use the one from the Dashboard webhook endpoint (Step 4). They look identical but are different secrets.
- The CLI can stay running locally for ongoing development; it won’t affect production.

---

## Quick checklist

- [ ] Stripe account activated (business info, ID, bank, tax).
- [ ] Live mode toggled on in Dashboard.
- [ ] `sk_live_...` copied securely.
- [ ] Live product + Payment Link created.
- [ ] Live Payment Link **After payment** → redirect to `https://YOUR_FRONTEND_DOMAIN/success?session_id={CHECKOUT_SESSION_ID}`.
- [ ] Live webhook endpoint added: `https://YOUR_BACKEND_DOMAIN/api/webhook/stripe`, event `checkout.session.completed`, signing secret copied.
- [ ] Production env vars updated: `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_WEBHOOK_SECRET=whsec_...` (Dashboard), `BASE_URL=https://...`.
- [ ] Backend redeployed; `/health` returns 200.
- [ ] `checkout.html` updated to live Payment Link URL; frontend redeployed.
- [ ] One real purchase → success page → PDF download works → webhook delivery 200 in Dashboard.
- [ ] Refund test purchase.

---

## Troubleshooting

- **“No such payment_intent”, “Invalid API Key provided”, or test/live mismatch errors**
  Your backend is using a `sk_test_...` key but Stripe is sending a live event (or vice versa). Make sure the key prefix matches the Payment Link prefix (`buy.stripe.com/...` for live, `buy.stripe.com/test_...` for test).

- **Webhook deliveries showing 400 “Webhook signature verification failed” in the live Dashboard**
  `STRIPE_WEBHOOK_SECRET` in production is wrong — it must be the secret from **Dashboard → Webhooks → your endpoint → Signing secret**, not the one `stripe listen` printed.

- **Webhook deliveries failing with timeouts / connection refused**
  The endpoint URL is not reachable. Confirm `BASE_URL` and the endpoint URL in Stripe both point to your real public HTTPS host, and that the host accepts inbound traffic on 443.

- **Success page can’t find the download (`session not found` or similar)**
  In live mode, the `session_id` Stripe appends is `cs_live_...` (test mode used `cs_test_...`). The backend code already accepts either — but if you ever filter by prefix, allow both. Also confirm the redirect URL on the **live** Payment Link points to the **live** frontend domain, not localhost.

- **Real card declined**
  Test cards (`4242 4242 4242 4242` etc.) never work in live mode. Use a real card.

- **PCI / compliance**
  Because checkout happens on Stripe’s hosted Payment Link, your site never sees the card number — you stay in the simplest **SAQ A** PCI bucket. Don’t change this by adding card fields to your own pages.

---

## What does *not* change going live

- Backend code (`backend/routes/stripe.js`, `backend/lib/stripe.js`, `backend/routes/stripeFulfill.js`, watermarking, one-time download links). Same logic handles test and live.
- Database / token storage.
- The success page (`success.html`) — it reads `session_id` from the query string the same way.
- Master PDF and watermark behavior.

Only the **keys, the Payment Link URL, the webhook endpoint, and the redirect URL** change.
