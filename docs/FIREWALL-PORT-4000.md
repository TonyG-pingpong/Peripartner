# Allow port 4000 so network testers can download the PDF

When a tester clicks "Download your PDF", their browser requests the file from **your computer on port 4000**. If Windows Firewall blocks that, the request never reaches your backend and nothing happens on their side.

Add a rule to allow inbound connections on port **4000** (and **3000** if testers cannot open the checkout page).

---

## Option 1: Windows Defender Firewall (GUI)

1. Press **Win + R**, type **wf.msc**, press Enter (opens Advanced Security).
2. Click **Inbound Rules** in the left pane.
3. Click **New Rule...** on the right.
4. Select **Port** → Next.
5. Select **TCP**, under "Specific local ports" enter: **3000, 4000** → Next.
6. Select **Allow the connection** → Next.
7. Leave **Domain**, **Private**, and **Public** all checked (or at least **Private** for home/LAN) → Next.
8. Name: e.g. **Peripartner backend and frontend** → Finish.

---

## Option 2: PowerShell (run as Administrator)

```powershell
New-NetFirewallRule -DisplayName "Peripartner TCP 3000 4000" -Direction Inbound -Protocol TCP -LocalPort 3000,4000 -Action Allow -Profile Private
```

This allows inbound TCP on ports 3000 and 4000 for **Private** (e.g. home) networks only.

---

## Check that it worked

- From the **tester's** machine, open a browser and go to:  
  **http://YOUR_IP:4000/health**  
  (e.g. http://192.168.1.217:4000/health)  
  You should see: `{"status":"ok","service":"peripartner-backend"}`  
  If that page loads, the firewall allows port 4000 and the download should work when they click the button.
