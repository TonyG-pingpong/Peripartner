# Stripe Payment Link – After payment setup

Use this guide to configure Stripe so that, after a successful payment, the buyer is sent back to your site and sees the **“Download your PDF”** button.

---

## 1. Open the “After payment” settings in Stripe

1. Go to `https://dashboard.stripe.com/` and make sure **Test mode** is enabled.
2. In the left menu, click **Product catalog** → **Payment links**.
3. Find your payment link (for example **“Perimenopause guide for partners”**) and click its **Name**.
4. On the payment link details page, click **Edit** (top right).
5. In the editor, click the **After payment** tab at the top.

---

## 2. Set the redirect URL

In the **After payment** tab:

1. Under **Confirmation page**, choose the option to **redirect customers to your website** (wording may be slightly different, for example “Don’t show confirmation page – Redirect customers to your website”).
2. In the URL field, enter the redirect URL in this form:

   ```text
   http://YOUR_IP:3000/success?session_id={CHECKOUT_SESSION_ID}
   ```

   - Replace `YOUR_IP` with the IP address of the computer running the site (for example `192.168.1.217`).
   - Keep `{CHECKOUT_SESSION_ID}` exactly as shown. Stripe automatically replaces this placeholder with the real session id (for example `cs_test_...`) when it redirects the buyer after payment.

3. Click **Update link** / **Save** to apply the change.

From now on, after a successful payment, Stripe will send the buyer to:

```text
http://YOUR_IP:3000/success?session_id=cs_test_123...
```

where `cs_test_123...` is the real id for that checkout session.

---

## 3. What happens after redirect (how the download link is produced)

This section is optional for non‑technical users, but useful to understand or share with developers.

1. **Stripe Checkout completes**
   - Stripe sends a `checkout.session.completed` webhook to your backend (forwarded by the Stripe CLI in test mode).

2. **Backend webhook handler (`POST /api/webhook/stripe`)**
   - Verifies the webhook signature using `STRIPE_WEBHOOK_SECRET`.
   - Reads the buyer’s email (and name, if available) from the Checkout Session.
   - Uses the master PDF (`MASTER_PDF_PATH`) to create a **watermarked PDF** for that buyer.
   - Saves it to a temp folder and creates a **one‑time token** (valid for 24 hours, single use).
   - Builds a one‑time download URL:
     - `http://YOUR_IP:4000/d/TOKEN`
   - Stores a mapping `session_id → token`, so it can be looked up later.

3. **Success page on your site (`/success`)**
   - Reads `session_id` from the redirect URL query string.
   - Calls your backend:
     - `GET http://YOUR_IP:4000/api/stripe/fulfill?session_id=cs_test_123...`
   - The backend:
     - Finds the stored token for that `session_id` (or, if needed, fetches the session from Stripe and creates the PDF and token again).
     - Returns JSON with:
       - `downloadUrl` → `http://YOUR_IP:4000/d/TOKEN`
       - `expiresAt` → when the link expires.

4. **“Download your PDF” button**
   - The success page sets the button’s `href` to `downloadUrl`.
   - When the buyer clicks **“Download your PDF”**:
     - The browser requests `http://YOUR_IP:4000/d/TOKEN`.
     - The backend serves the watermarked PDF once, then invalidates the token so the link cannot be reused.

---

## 4. Quick checklist

- [ ] Payment Link exists in Stripe.
- [ ] In **After payment** tab, redirect is set to  
      `http://YOUR_IP:3000/success?session_id={CHECKOUT_SESSION_ID}`.
- [ ] Backend is running on `http://YOUR_IP:4000`.
- [ ] Frontend is running on `http://YOUR_IP:3000`.
- [ ] Stripe webhooks are configured/forwarded so `checkout.session.completed` reaches your backend.
- [ ] After payment, buyer sees **“Thanks for your payment”** and **“Download your PDF”**, and clicking it downloads the watermarked PDF.

