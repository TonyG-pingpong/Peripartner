# Backend design: Webhook → Watermark → One-time download link

## Overview

- **Step 1:** No PDF on the public site. Only the backend has the master PDF.
- **Step 2:** Gumroad sends a webhook when a sale completes.
- **Step 3:** Backend creates a unique PDF per purchase with **all** watermark options:
  - **Visible watermark:** e.g. “Licensed to buyer@email.com” (and/or name) on each page.
  - **Invisible watermark:** optional metadata or steganography (e.g. buyer email in PDF metadata / custom XMP or simple pattern). Documented so we can add later if needed.
- **Step 4:** Backend generates a **one-time download link** valid for **24 hours**. Customer gets that link (e.g. via Gumroad redirect or email). Clicking it serves the PDF once, then the link is invalidated.

Stack: **Node.js** (Express), with PDF watermarking and a simple store for one-time tokens.

---

## Flow (high level)

```
[Customer pays on Gumroad]
         ↓
[Gumroad sends POST to your webhook URL]
         ↓
[Backend verifies webhook, reads buyer email/name]
         ↓
[Backend loads master PDF, adds visible (+ optional invisible) watermark]
         ↓
[Backend saves watermarked PDF temporarily, creates one-time token (expires 24h)]
         ↓
[Backend returns / stores the download URL for the customer]
         ↓
[Customer visits download URL within 24h]
         ↓
[Backend serves PDF once, then invalidates the link]
```

---

## Step 1: No PDF on the public site

- The current static site (e.g. `index.html`, `checkout.html`) does **not** link to any PDF.
- The **master PDF** lives only on the backend server (or in a secure store the backend can read). The public never has a direct URL to it.

No code changes needed on the front if we keep it as is; only the “Pay” button sends users to Gumroad.

---

## Step 2: Gumroad webhook

### What Gumroad sends

- Gumroad can POST to a URL of your choice when events happen (e.g. “sale succeeded”).
- Typical payload (Gumroad format) includes things like:
  - `seller_id`, `product_id`, `order_id`
  - `email` (buyer)
  - `purchase_email` (often same)
  - Optional: custom fields or name if you collect them

We only need: **buyer email** (required for watermark and delivery), and **name** if Gumroad sends it.

### Backend endpoint

- **POST** `/api/webhook/gumroad`
- Verify the request is from Gumroad (e.g. signature or shared secret if Gumroad provides one).
- Parse JSON body, confirm event type is “sale”/“order completed”, then:
  - Extract `email` (and `name` if present).
  - Call the “create watermarked PDF + one-time link” logic (Step 3 + 4).
  - Optionally respond with 200 and a body that tells Gumroad where to send the customer (e.g. redirect URL). If Gumroad supports “redirect after purchase” to a URL with a token, we can build that URL here.

### Gumroad configuration (your side)

- In Gumroad dashboard: set **Webhook URL** to:  
  `https://your-backend-domain.com/api/webhook/gumroad`
- If Gumroad offers a webhook secret, we’ll store it in env and verify in the handler.

---

## Step 3: Watermark (all options)

### 3a. Visible watermark

- **Content:** e.g. “Licensed to {email}” or “{name} ({email})” on each page.
- **Placement:** bottom or corner of each page; semi-transparent so it doesn’t destroy readability.
- **Implementation:** Node.js library that can add text to each page of a PDF (e.g. **pdf-lib** for Node, or **pdf-lib** + render text on each page). We’ll add one text layer per page with the buyer string.

### 3b. Invisible / metadata watermark

- **Option A – PDF metadata:** Write buyer email (and optionally name) into the PDF’s standard metadata (e.g. “Subject”, “Keywords”, or custom fields). This is invisible to the eye but visible in “Document properties”. Easy to implement with pdf-lib.
- **Option B – Custom XMP or internal structure:** If we need something harder to strip, we can add a custom XMP field or internal structure. Design supports this; we can add in a later iteration.

For the first version we’ll implement:
- **Visible:** text on each page.
- **Invisible:** buyer email (and name if present) in PDF metadata.

### 3c. Master PDF and output

- Backend has a **master PDF** path (e.g. env `MASTER_PDF_PATH` or a fixed path under the project). Never exposed to the internet.
- For each sale we:
  - Copy/load master PDF.
  - Apply visible watermark (each page).
  - Set invisible metadata (author/custom field = email).
  - Write to a **temporary file** or in-memory buffer, then pass to “one-time link” logic. Temp files can be deleted after the link is consumed or after 24h.

---

## Step 4: 24h one-time download link

### Token and store

- **Token:** Cryptographically random string (e.g. 32 bytes hex) stored with:
  - Path to the watermarked PDF (or the PDF in memory/blob store).
  - **Expiry:** `created_at + 24 hours`.
  - **One-time:** flag or “consumed” flag; after first successful download, mark as used and never serve again.

### Storage options (simple, no DB required for MVP)

- **In-memory:** `Map<token, { pdfPathOrBuffer, expiresAt, consumed }>`. Simple; tokens lost on restart (acceptable for MVP: links issued after restart still work until 24h or first use).
- **File-based:** One JSON file or one file per token (e.g. token as filename), storing path to the generated PDF and expiry. Backend reads on startup and on each download check.
- **SQLite:** One table `download_tokens (token, pdf_path, expires_at, consumed)`. Good next step if we want persistence across restarts.

Design choice for first version: **in-memory** store. If the process restarts, old links break (customer would need to contact you for a new link). We can switch to file or SQLite later without changing the external flow.

### Routes

- **Generate (internal):** After watermarking, backend calls something like `createOneTimeLink(pdfBuffer)` which:
  - Saves PDF to temp file (or keeps in memory).
  - Generates token, stores `{ pdfPath or buffer, expiresAt: now + 24h, consumed: false }`.
  - Returns the **public download URL**: `https://your-backend-domain.com/d/TOKEN` (or `/api/download/TOKEN`).

- **Download (public):** **GET** `/d/:token`
  - Look up token. If missing, expired, or already consumed → 404 or 410 Gone.
  - If valid: stream the PDF once, set `consumed = true`, then delete temp file (or mark so a cron can delete). Response headers: `Content-Disposition: attachment; filename="peripartner-guide.pdf"`.

### Delivering the link to the customer

- **Option A – Gumroad redirect:** If Gumroad allows “Redirect URL after purchase” with a dynamic parameter, we could build:  
  `https://your-backend-domain.com/d/TOKEN`  
  and pass that URL to Gumroad in the webhook response or via Gumroad’s “redirect” setting (if they support per-sale redirect). Then customer lands on our page and the PDF downloads or we show a “Download your PDF” button that hits `/d/TOKEN`.
- **Option B – Email:** Backend sends an email to the buyer with the one-time link. Requires SMTP or a transactional email API (e.g. SendGrid, Resend). Design supports this; we add a small email step in the webhook handler.
- **Option C – Gumroad overlay:** Gumroad may let you show a “content” or “overlay” after purchase; we could point that to a page we host that says “Check your email for the download link” or “Click here to download” (where “here” is built with the token we generated). So we still need to pass the token to the customer somehow (e.g. redirect to our URL with token in path).

For the design we’ll assume:
- Webhook handler generates the one-time link.
- We **return** or **store** that link so it can be:
  - Shown to the user (e.g. redirect to a “Thank you” page that includes the link), or
  - Sent by email (if we add a small email sender in the backend).

So step 4 is: **webhook → watermark → create 24h one-time link → expose link to customer (redirect or email).**

---

## Tech stack (summary)

| Layer        | Choice |
|-------------|--------|
| Runtime     | Node.js |
| Server      | Express |
| Webhook     | POST `/api/webhook/gumroad`, verify, parse Gumroad payload |
| PDF         | pdf-lib (load master, add text per page, set metadata) |
| One-time    | In-memory store (token → { path/buffer, expiresAt, consumed }) |
| Download    | GET `/d/:token` → stream PDF once, mark consumed, 24h expiry |

---

## File structure (backend)

```
backend/
├── DESIGN.md              # This file
├── package.json
├── .env.example           # GUMROAD_WEBHOOK_SECRET, MASTER_PDF_PATH, etc.
├── server.js              # Express app, mount routes
├── routes/
│   ├── webhook.js         # POST /api/webhook/gumroad
│   └── download.js        # GET /d/:token
├── lib/
│   ├── watermark.js      # loadMasterPdf(), addVisibleWatermark(), addMetadata()
│   ├── onetime.js         # createOneTimeLink(), consumeToken()
│   └── gumroad.js         # verifyWebhook(), parseSalePayload()
├── store/
│   └── tokens.js          # in-memory token store (get/set/delete)
└── temp/                  # generated PDFs (gitignore); or keep in memory
```

---

## Environment variables

- `PORT` – server port (e.g. 4000).
- `MASTER_PDF_PATH` – path to the master PDF (no watermark).
- `GUMROAD_WEBHOOK_SECRET` – (if Gumroad provides) secret to verify webhook signature.
- `BASE_URL` – e.g. `https://your-backend-domain.com` for building download links.
- Optional later: `SMTP_*` or `SENDGRID_API_KEY` for email delivery of the link.

---

## Security notes

- Validate webhook signature so only Gumroad can trigger PDF generation.
- Rate-limit webhook and download endpoints.
- Tokens: long random, 24h expiry, single use.
- Master PDF and temp PDFs not under a web-accessible path; only served via the one-time token handler.
- In production, run over HTTPS; set `BASE_URL` to HTTPS.

---

## Next step

Implementation will follow this design: **webhook → verify → watermark (visible + metadata) → one-time 24h link → deliver link (redirect or email)**. If you want, next we can add `package.json`, `server.js`, and the routes/lib files in the repo.
