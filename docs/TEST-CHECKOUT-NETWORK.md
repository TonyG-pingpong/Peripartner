# Test the checkout and purchase (for users on your network)

Use these steps so other people on your network can open the checkout page and run through a test purchase.

---

## Quick start (script)

From the **project root**, run:

- **PowerShell:** `.\start.ps1`  
  (If you get an execution policy error: `powershell -ExecutionPolicy Bypass -File .\start.ps1`)
- **Or double‑click:** `start.cmd`

The script will ask:

- **(L) Local** – only this computer (localhost). Starts backend and frontend; opens two windows.
- **(N) Network** – others on your LAN can test. You’ll enter this PC’s IP (or it will try to detect it). Backend and frontend start with that IP; the script prints a **message to send to testers** and saves it to `message-for-testers.txt`.

In both modes you still need to run **Stripe webhook forwarding** in a separate terminal (see full steps below).

---

## For you (person running the app)

1. **Start the servers** (see [STRIPE-CHECKOUT-TESTING.md](STRIPE-CHECKOUT-TESTING.md) for full setup):
   - Terminal 1: `npx serve` (from project root)
   - Terminal 2: `cd backend && npm start`
   - Terminal 3: `stripe listen --forward-to http://localhost:4000/api/webhook/stripe --events checkout.session.completed`

2. **Find your computer’s IP** (so others can reach it):
   - Windows: `ipconfig` → look for **IPv4 Address** (e.g. `192.168.1.100`)
   - Mac/Linux: `ifconfig` or `ip addr` → look for your LAN address

3. **If others will test from other devices**, update Stripe so the success page works for them:
   - Stripe Dashboard → Payment Links → edit your link → **After payment** tab.
   - Set redirect URL to use your IP instead of `localhost`:
     - `http://YOUR_IP:3000/success?session_id={CHECKOUT_SESSION_ID}`
     - Example: `http://192.168.1.100:3000/success?session_id={CHECKOUT_SESSION_ID}`
   - In `backend/.env`, set `BASE_URL=http://YOUR_IP:4000` (same IP, port 4000) so download links use the correct host.

4. **Tell testers** the checkout URL (see below).

---

## For other testers (on your network)

1. **Open the checkout page**  
   In a browser, go to:
   ```text
   http://YOUR_IP:3000
   ```
   (Replace `YOUR_IP` with the address you were given, e.g. `192.168.1.100`.)

2. **Go to checkout**  
   Click **“Buy this”** (or open `http://YOUR_IP:3000/checkout.html`).

3. **Pay with the test card**  
   Click **“Pay with card (Stripe)”**, then on Stripe’s page use:
   - **Card:** `4242 4242 4242 4242`
   - **Expiry:** any future date (e.g. 12/34)
   - **CVC:** any 3 digits
   - **Email:** any (e.g. your email)

4. **Complete payment**  
   Finish the payment on Stripe.

5. **Get your PDF**  
   You should be redirected to a **“Thanks for your payment”** page. Click **“Download your PDF”**. The file is a one-time link and works once; it’s valid for 24 hours.

---

## Quick reference for testers

| Step | Action |
|------|--------|
| 1 | Open **http://YOUR_IP:3000** in a browser |
| 2 | Click **Buy this** → **Pay with card (Stripe)** |
| 3 | Use card **4242 4242 4242 4242**, any future expiry, any CVC |
| 4 | Complete payment → you’ll see **Thanks for your payment** |
| 5 | Click **Download your PDF** (one-time, 24h link) |
