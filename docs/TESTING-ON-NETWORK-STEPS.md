# Steps for testing on the network

Use these steps so you (the host) can run the app and others on your LAN can test checkout and PDF download from their devices.

---

## On your computer (host)

### 1. Allow firewall (one-time)

So testers can reach the frontend (3000) and backend (4000):

- **GUI:** Win + R → `wf.msc` → Inbound Rules → New Rule → Port → TCP → **3000, 4000** → Allow.
- **Or PowerShell (Admin):**  
  `New-NetFirewallRule -DisplayName "Peripartner TCP 3000 4000" -Direction Inbound -Protocol TCP -LocalPort 3000,4000 -Action Allow -Profile Private`

See [FIREWALL-PORT-4000.md](FIREWALL-PORT-4000.md) for details.

### 2. Know your IP (optional)

- Run `ipconfig` and note your **IPv4 Address** (e.g. `192.168.1.217`).  
- Or leave it blank when the script asks; it may detect it.

### 3. Start the project in network mode

1. From the project root, run **`start.cmd`** (or double‑click it).
2. When asked **Start for (L)ocal or (N)etwork?** type **N** and press Enter.
3. Enter this PC’s **IP address** (or press Enter to use the detected one).
4. Two windows will open (backend and frontend). Leave them open.
5. The script will save **message-for-testers.txt** with the URL and instructions for testers.

### 4. Set Stripe success URL

So after payment Stripe sends the buyer back to your success page:

1. Open **Stripe Dashboard** → **Payment Links** → edit your link.
2. Go to the **After payment** (or **Confirmation page**) section.
3. Set the redirect URL to (use your actual IP):
   ```text
   http://YOUR_IP:3000/success.html?session_id={CHECKOUT_SESSION_ID}
   ```
   Example: `http://192.168.1.217:3000/success.html?session_id={CHECKOUT_SESSION_ID}`
4. Save.

### 5. Start Stripe webhook forwarding (for PDF generation)

In a **third** terminal (on the same PC):

```powershell
stripe listen --forward-to http://localhost:4000/api/webhook/stripe --events checkout.session.completed
```

Leave this running. Use the **webhook signing secret** it prints (`whsec_...`) in `backend/.env` as `STRIPE_WEBHOOK_SECRET` if you haven’t already.

### 6. Send testers the message

Open **message-for-testers.txt** (in the project root). Copy its contents and send them to your testers (email, chat, etc.). It contains the URL (e.g. `http://192.168.1.217:3000`) and what to do.

### 7. Optional: check backend is reachable

From another device (or the same PC), open in a browser:

```text
http://YOUR_IP:4000/health
```

You should see: `{"status":"ok","service":"peripartner-backend"}`. If that loads, port 4000 is open and the PDF download should work.

---

## For testers (on the network)

1. **Open the link** you received (e.g. `http://192.168.1.217:3000`) in a browser.
2. Click **“Get the Guide”** (or **“Buy this”**) → **“Pay with card (Stripe)”**.
3. On Stripe’s page use the **test card:** `4242 4242 4242 4242`, expiry e.g. `12/34`, any 3-digit CVC.
4. Complete the payment.
5. You should land on **“Thanks for your payment”**. Click **“Download your PDF”** (one-time link, valid 24 hours).

**Note:** If Chrome shows “This site isn’t using a secure connection…” when downloading, that’s normal for HTTP. Click **“Download insecure file”** to get the PDF.

---

## Quick checklist (host)

| Step | Action |
|------|--------|
| 1 | Allow firewall for ports **3000** and **4000** |
| 2 | Run **start.cmd** → choose **(N)etwork** → enter your IP |
| 3 | In Stripe Dashboard, set Payment Link redirect to **http://YOUR_IP:3000/success.html?session_id={CHECKOUT_SESSION_ID}** |
| 4 | In a third terminal, run **stripe listen --forward-to http://localhost:4000/api/webhook/stripe --events checkout.session.completed** |
| 5 | Send testers the contents of **message-for-testers.txt** |
