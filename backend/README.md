# Peripartner backend

Webhook → watermark PDF → one-time 24h download link. Node.js (Express + pdf-lib).

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
   - `GUMROAD_WEBHOOK_SECRET` – (optional) if Gumroad provides a webhook secret, set it here.

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
| POST | `/api/webhook/gumroad` | Gumroad webhook. Body must include buyer `email` (and optionally `name`). Returns `downloadUrl` and `expiresAt`. |
| GET | `/d/:token` | One-time download. Valid 24h, single use. |
| GET | `/health` | Health check. |

## Gumroad webhook

1. In Gumroad: Product → Webhooks (or Settings) set **Webhook URL** to:
   `https://your-backend-domain.com/api/webhook/gumroad`
2. On each sale Gumroad POSTs a payload. Backend expects JSON with at least one of: `email`, `purchaser_email`, `buyer_email`, or `purchase.email`.
3. Response: `{ success: true, downloadUrl, expiresAt }`. Use `downloadUrl` in your “thank you” redirect or email.

## Project name

This backend is part of **Peripartner** (peripartner-backend in `package.json`).
