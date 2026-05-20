# Stripe Payment Link – After payment setup (Live mode)

Use this guide to configure your **live** Stripe Payment Link so that, after a successful real‑card payment, the buyer is sent back to your site and sees the **“Download your PDF”** button.

> This document is for **live mode** (real credit cards). If you’re still testing with `4242 4242 4242 4242` and the Stripe CLI, see `docs/STRIPE-CHECKOUT-TESTING.md` instead. For the full switch from test to live, see `docs/STRIPE-GO-LIVE.md`.

---

## 1. Open the “After payment” settings in Stripe

1. Go to `https://dashboard.stripe.com/` and make sure **Live mode** is enabled (the top‑left toggle is **off** / no orange “Test mode” banner).
2. In the left menu, click **Product catalog** → **Payment links**.
3. Find your **live** payment link (for example **“Perimenopause guide for partners”** — its URL is `https://buy.stripe.com/...` without the `test_` prefix) and click its **Name**.
4. On the payment link details page, click **Edit** (top right).
5. In the editor, click the **After payment** tab at the top.

---

## 2. Set the redirect URL

In the **After payment** tab:

1. Under **Confirmation page**, choose the option to **redirect customers to your website** (wording may be slightly different, for example “Don’t show confirmation page – Redirect customers to your website”).
2. In the URL field, enter the redirect URL in this form:

   ```text
   https://YOUR_FRONTEND_DOMAIN/success?session_id={CHECKOUT_SESSION_ID}
   ```

   - Replace `YOUR_FRONTEND_DOMAIN` with your **public site domain** over **HTTPS** (for example `peripartner.com`). Live mode will not accept `http://...`, `localhost`, or a private IP — buyers can’t reach those.
   - Keep `{CHECKOUT_SESSION_ID}` exactly as shown. Stripe automatically replaces this placeholder with the real session id (for example `cs_live_...`) when it redirects the buyer after payment.

3. Click **Update link** / **Save** to apply the change.

From now on, after a successful payment, Stripe will send the buyer to:

```text
https://YOUR_FRONTEND_DOMAIN/success?session_id=cs_live_123...
```

where `cs_live_123...` is the real id for that checkout session.

---

## 3. What happens after redirect (how the download link is produced)

This section is optional for non‑technical users, but useful to understand or share with developers.

1. **Stripe Checkout completes**
   - Stripe sends a `checkout.session.completed` webhook directly to your live backend endpoint (the one you registered in **Developers → Webhooks** in live mode — no Stripe CLI involved).

2. **Backend webhook handler (`POST /api/webhook/stripe`)**
   - Verifies the webhook signature using `STRIPE_WEBHOOK_SECRET` (the live signing secret from Dashboard → Webhooks → your endpoint).
   - Reads the buyer’s email (and name, if available) from the Checkout Session.
   - Uses the master PDF (`MASTER_PDF_PATH`) to create a **watermarked PDF** for that buyer.
   - Saves it to a temp folder and creates a **one‑time token** (valid for 24 hours, single use).
   - Builds a one‑time download URL:
     - `https://YOUR_BACKEND_DOMAIN/d/TOKEN`
   - Stores a mapping `session_id → token`, so it can be looked up later.

3. **Success page on your site (`/success`)**
   - Reads `session_id` from the redirect URL query string.
   - Calls your backend:
     - `GET https://YOUR_BACKEND_DOMAIN/api/stripe/fulfill?session_id=cs_live_123...`
   - The backend:
     - Finds the stored token for that `session_id` (or, if needed, fetches the session from Stripe and creates the PDF and token again).
     - Returns JSON with:
       - `downloadUrl` → `https://YOUR_BACKEND_DOMAIN/d/TOKEN`
       - `expiresAt` → when the link expires.

4. **“Download your PDF” button**
   - The success page sets the button’s `href` to `downloadUrl`.
   - When the buyer clicks **“Download your PDF”**:
     - The browser requests `https://YOUR_BACKEND_DOMAIN/d/TOKEN`.
     - The backend serves the watermarked PDF once, then invalidates the token so the link cannot be reused.

---

## 4. Quick checklist

- [ ] Stripe Dashboard is in **Live mode** (no orange banner).
- [ ] Live Payment Link exists (URL is `https://buy.stripe.com/...`, no `test_` prefix) and is the one referenced from `checkout.html`.
- [ ] In **After payment** tab, redirect is set to
      `https://YOUR_FRONTEND_DOMAIN/success?session_id={CHECKOUT_SESSION_ID}` (HTTPS, public domain).
- [ ] Backend is deployed and reachable at `https://YOUR_BACKEND_DOMAIN` (HTTPS).
- [ ] Frontend is deployed and reachable at `https://YOUR_FRONTEND_DOMAIN` (HTTPS).
- [ ] Stripe **live** webhook endpoint exists at `https://YOUR_BACKEND_DOMAIN/api/webhook/stripe`, subscribed to `checkout.session.completed`, and its signing secret is set in the production `STRIPE_WEBHOOK_SECRET`.
- [ ] Production backend has `STRIPE_SECRET_KEY=sk_live_...` and `BASE_URL=https://YOUR_BACKEND_DOMAIN`.
- [ ] After a real payment, buyer sees **“Thanks for your payment”** and **“Download your PDF”**, and clicking it downloads the watermarked PDF.

