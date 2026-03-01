# Peripartner – Perimenopause guide for partners

A static landing page that mirrors the [Gumroad product page](https://margaritaflare100.gumroad.com/l/peripartner) so you can run it locally and later deploy to the web.

## Run locally on your computer

1. Open a terminal in this folder (`c:\projects\Peripartner`).
2. Run one of these:
   - **Option A (Node):** `npx serve` then open http://localhost:3000
   - **Option B (Python 3):** `python -m http.server 8080` then open http://localhost:8080
   - **Option C:** Open `index.html` in your browser (some features may differ without a server).

## Deploy to the internet

Use the same files (this folder) with any static host:

- **Netlify:** Drag this folder to [app.netlify.com/drop](https://app.netlify.com/drop) or connect a Git repo.
- **Vercel:** Import the project and set the root to this folder.
- **GitHub Pages:** Push the repo and enable Pages for the branch; set the source to this folder or `docs`.

No build step is required.

## Customize

- **Copy:** Edit `index.html` (title, description, bullet points, price text).
- **Styling:** Edit `styles.css` (colors, fonts, spacing). The CTA uses a Gumroad-like pink (`#ff90e8`); change `.cta-button` to match your brand.
- **Cover image:** Replace the `.cover-placeholder` div with an `<img>` pointing to your product image.
- **Buy link:** Update the `href` of the “I want this!” button to your Gumroad (or other) checkout URL.

## PDF download (one-time, after payment)

The guide is delivered only after payment via a **backend** that watermarks the PDF and issues a **one-time 24h download link**. See **`backend/`** below.

## Backend (webhook → watermark → one-time link)

The **Peripartner backend** (Node.js) receives Gumroad webhooks, generates a watermarked PDF per buyer, and returns a one-time download URL valid for 24 hours.

- **Setup and run:** See [backend/README.md](backend/README.md).
- **Endpoints:** `POST /api/webhook/gumroad`, `GET /d/:token` (download).
- **Project name:** `peripartner-backend` in `backend/package.json`.

## File structure

```
Peripartner/
├── index.html
├── checkout.html
├── styles.css
├── checkout.css
├── backend/                 # Webhook + watermark + one-time download
│   ├── server.js
│   ├── package.json
│   ├── master/              # Put master PDF here (see backend README)
│   ├── routes/
│   ├── lib/
│   └── store/
└── README.md
```
