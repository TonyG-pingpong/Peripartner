# What to look for when you click "Download your PDF"

## What should happen

When you click **"Download your PDF"** on the "Thanks for your payment" page:

1. **Your browser** requests the PDF from the server (your host's computer).
2. The file **peripartner-guide.pdf** should:
   - **Download** into your usual Downloads folder, or
   - **Open** in a new tab/window (depending on your browser and settings).

So you should see either:
- A **download** (e.g. a bar at the bottom, or a new file in your **Downloads** folder), or  
- A **new tab** with the PDF open.

---

## If nothing seems to happen

1. **Check your Downloads folder**  
   The file may have downloaded automatically. Look for **peripartner-guide.pdf** (or the name set by the site).

2. **Try right‑click → "Save link as"**  
   Right‑click the "Download your PDF" button and choose **Save link as** (or **Save target as**). Pick a folder and save. Then open the saved file.

3. **Check for a blocked download**  
   Some browsers block automatic downloads. Look for a **blocked-download** icon or message in the address bar or at the top of the page and choose **Allow** or **Always allow** for this site, then click the button again.

4. **Allow pop‑ups for this site**  
   If the PDF opens in a new tab, a pop‑up blocker might have stopped it. Allow pop‑ups for the site (e.g. `http://192.168.1.217:3000`) and try again.

---

## For the host (you)

- When the tester clicks Download, **your backend window** should show a line like:  
  `[Download] Serving PDF for token abc12345...`  
- If that line **never** appears, the tester's browser is not reaching your backend (e.g. **firewall** blocking port **4000** from the network).  
  **Fix:** In Windows, allow inbound TCP port **4000** (and **3000** if needed) for your Node/backend app or for "Private" networks.

---

## Common warnings (and will they appear after deploy?)

| Warning | Can we remove it? | After deploy? |
|--------|--------------------|---------------|
| **"Your connection is not private" / "Not secure"** (when opening the site or the download link over HTTP) | Not in code — it's the browser warning about HTTP. | **No.** Use HTTPS and a proper domain; this warning goes away. |
| **Mixed content** (page loads over HTTPS but download link is `http://...`) | **Yes.** Set backend `BASE_URL` to your production HTTPS URL (e.g. `https://api.yoursite.com`) so the download link is also HTTPS. | Avoided if `BASE_URL` is HTTPS in production. |
| **"This file isn't commonly downloaded"** (Chrome/some browsers for PDFs) | Browser heuristic; we can't fully remove it. Backend already sends correct `Content-Type` and `Content-Disposition`. | May still appear occasionally; user can choose "Keep" / "Save". |
| **Stripe "Test mode"** banner on Stripe's checkout page | We can't remove it; it's on Stripe's site. | **No.** Use live Stripe keys and it disappears. |

**If you see a different warning:** copy the exact message (or a screenshot) and share it so we can target that case.
