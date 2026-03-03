# How buying and downloading the PDF works – step by step

This document explains every step from “customer sees the product” to “customer has the watermarked PDF,” so you can review and understand the full flow.

---

## Overview

1. **Customer visits your site** → sees the product and clicks “Buy this”
2. **Customer goes to your checkout page** → sees order summary and clicks “Pay”
3. **Customer pays on Gumroad** → Gumroad processes the payment
4. **Gumroad notifies your backend** → webhook sends buyer email (and name)
5. **Your backend creates a unique PDF** → watermarked with buyer’s email/name
6. **Your backend creates a one-time link** → valid 24 hours, single use
7. **Customer gets the link** → and downloads the PDF once

Below, each step is explained in detail.

---

## Step 1: Customer visits your product page

**What happens**

- Someone opens your **landing page** (e.g. `index.html` or your deployed site).
- They see:
  - Product title: “Perimenopause guide for partners”
  - Image, price ($19.99), and a **“Buy this”** button (in the top bar and in the sidebar).

**What they do**

- Click **“Buy this”**.

**Where it goes**

- The button links to your **checkout page** (`checkout.html`), not directly to Gumroad. So the next step is your own checkout page.

---

## Step 2: Customer is on your checkout page

**What happens**

- The browser loads your **checkout page** (e.g. `checkout.html`).
- They see:
  - Product: “Perimenopause guide for partners” and price (e.g. US$19.99)
  - Options like “Give as a gift?”, “Add a tip?”
  - Contact fields (email, name, country, etc.) and card fields
  - A **“Pay”** button

**What they do**

- Enter their details and click **“Pay”**.

**Where it goes**

- The **“Pay”** button links to **Gumroad’s checkout URL** (the one you set in the HTML). So the customer is sent to Gumroad to complete payment. Your checkout page does **not** collect or process the card; Gumroad does.

---

## Step 3: Customer pays on Gumroad

**What happens**

- The customer is on **Gumroad’s site** (e.g. `gumroad.com/checkout?...`).
- They enter payment details and complete the purchase.
- Gumroad charges the card and records the sale.
- Gumroad knows the buyer’s **email** (and optionally **name**) from the checkout.

**What Gumroad does next**

- Gumroad sends a **webhook** (an HTTP POST request) to a URL you configured. That URL is your **backend’s webhook endpoint**. So: “payment completed” → Gumroad calls your server.

---

## Step 4: Gumroad calls your backend (webhook)

**What happens**

- Gumroad sends a **POST** request to your backend, for example:
  - `https://your-backend.com/api/webhook/gumroad`
- The body of the request is (typically) **JSON** and includes sale data, including the buyer’s **email** and sometimes **name** (e.g. `email`, `purchaser_email`, or `purchase.email`).

**What your backend does**

- Receives the request.
- Optionally checks that the request really came from Gumroad (e.g. with a webhook secret).
- Reads the buyer’s **email** (and **name** if present) from the JSON.
- If something is wrong (e.g. no email), it responds with an error. Otherwise it continues to the next step.

**Why this step matters**

- This is how your server finds out “this person paid” and “this is their email/name” so it can create **their** personalized PDF and send them **their** download link.

---

## Step 5: Backend creates a watermarked PDF

**What happens**

- Your backend has a **master PDF** (the guide without any buyer info), stored in a place only the server can read (e.g. `backend/master/peripartner-guide.pdf`).
- For **this** purchase, the backend:
  1. **Loads** the master PDF.
  2. **Adds a visible watermark** on every page:  
     `Licensed to [name] ([email])` or `Licensed to [email]` if no name.
  3. **Adds an invisible watermark** by writing the buyer’s email (and name if present) into the PDF’s **metadata** (so if the file is shared, you can see who it was issued to).
  4. **Saves** this new PDF to a temporary file (e.g. under `backend/temp/`), with a unique name tied to a one-time token.

**Result**

- One unique PDF per purchase, with that buyer’s identity on it. The file is only on your server; the customer does not have it yet.

---

## Step 6: Backend creates a one-time download link

**What happens**

- Your backend generates a **random token** (long, unguessable string).
- It stores in memory: “this token → this watermarked PDF file, expires at [now + 24 hours], not yet used.”
- It builds the **download URL**:
  - Example: `https://your-backend.com/d/abc123...`
- It **responds** to Gumroad’s webhook with a success response that can include this **download URL** (and expiry time). How you use that URL (e.g. show it on a thank-you page or send it by email) depends on how you connect Gumroad to your site or email.

**Rules of the link**

- **Valid for 24 hours** after it’s created.
- **One-time use**: after the customer downloads the PDF once, the link is marked as used and will not serve the file again.
- So: one link per purchase, one download per link, 24h expiry.

---

## Step 7: Customer gets the link and downloads the PDF

**What happens**

- The customer must **receive** the download URL somehow. Common options:
  - **Redirect:** After payment, Gumroad (or your site) sends them to a “Thank you” page that shows the link or a “Download your PDF” button that uses this URL.
  - **Email:** Your system (or a Gumroad integration) sends an email that contains the same link.
- The customer **clicks the link** (e.g. `https://your-backend.com/d/abc123...`).
- The browser sends a **GET** request to your backend with that token.

**What your backend does**

- Looks up the token:
  - If the token is **missing, expired, or already used** → responds with a message like “This download link has expired or has already been used” (and does **not** send the PDF).
  - If the token is **valid** → streams the watermarked PDF to the browser once, then **marks the link as used** and deletes the temporary PDF file.
- The browser typically **downloads** the file (e.g. “peripartner-guide.pdf”) to the customer’s computer.

**Result**

- The customer has the PDF **once**, with their email/name on it (visible and in metadata). They cannot use that link again; if they need another copy, you’d have to generate a new link (e.g. via support or a “resend download” flow).

---

## Summary table

| Step | Who / What | Action |
|------|------------|--------|
| 1 | Customer | Visits your product page, clicks “Buy this” |
| 2 | Customer | On your checkout page, clicks “Pay” |
| 3 | Customer + Gumroad | Pays on Gumroad; Gumroad records sale and buyer email/name |
| 4 | Gumroad → Your backend | POST to `/api/webhook/gumroad` with buyer data |
| 5 | Your backend | Creates watermarked PDF (visible + metadata) for that buyer |
| 6 | Your backend | Creates one-time 24h link, returns it (e.g. in webhook response) |
| 7 | Customer | Gets link (e.g. thank-you page or email), clicks once, downloads PDF; link then stops working |

---

## Important details

- **Payment** is only on **Gumroad**. Your site and backend never see the card number.
- **Delivery** is only via your **backend**: the PDF is created and served by your server when the customer uses the one-time link.
- **Watermark** ties the PDF to the buyer so it’s clear who it was licensed to and discourages sharing.
- **One-time + 24h** limits how often the link can be used and how long it stays valid.

If you want, we can next write down the **exact** URLs and file paths used in your project (e.g. your real Gumroad product URL and your backend domain) in one place so you can double-check each step in your environment.
