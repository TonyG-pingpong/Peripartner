# Peripartner startup script: Local or Network testing
# Run from project root: .\start.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$BackendPath = Join-Path $ProjectRoot "backend"

# Stop any process listening on the given port (avoids EADDRINUSE).
function Stop-ProcessOnPort {
    param([int]$Port)
    $pids = @()
    # Method 1: Get-NetTCPConnection (Windows, more reliable)
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) { if ($c.OwningProcess) { $pids += $c.OwningProcess } }
    } catch {}
    # Method 2: netstat fallback (IPv4 and IPv6, e.g. 0.0.0.0:4000 or [::]:4000)
    if ($pids.Count -eq 0) {
        try {
            $netstat = netstat -ano 2>$null
            foreach ($line in $netstat) {
                $s = $line.ToString()
                if (($s -match ":${Port}\s+" -or $s -match "]:${Port}\s+") -and $s -match 'LISTEN') {
                    $parts = $s -split '\s+', [System.StringSplitOptions]::RemoveEmptyEntries
                    $last = $parts[-1]
                    if ($last -match '^\d+$') { $pids += [int]$last }
                }
            }
        } catch {}
    }
    $pids = $pids | Select-Object -Unique
    foreach ($p in $pids) {
        Write-Host ('  Stopping process on port ' + $Port + ' (PID ' + $p + ')...') -ForegroundColor Yellow
        & taskkill /PID $p /F 2>$null | Out-Null
        Start-Sleep -Milliseconds 300
    }
}

if (-not (Test-Path (Join-Path $BackendPath "package.json"))) {
    Write-Host 'Error: Run this script from the Peripartner project root (where backend/ exists).' -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host '  Peripartner - Start for testing' -ForegroundColor Cyan
Write-Host '  -------------------------------' -ForegroundColor Cyan
Write-Host ""
Write-Host '  (L) Local    - only this computer (localhost)' -ForegroundColor White
Write-Host '  (N) Network  - other users on your LAN can open the checkout page' -ForegroundColor White
Write-Host ""

$mode = Read-Host '  Start for (L)ocal or (N)etwork? (L/N)'
$mode = ($mode.Trim().ToUpper() + "L").Substring(0, 1)

$baseUrl = "http://localhost:4000"
$frontendUrl = "http://localhost:3000"
$networkIp = $null

if ($mode -eq "N") {
    Write-Host ""
    Write-Host '  Enter this computer''s IP address so others can reach the app.' -ForegroundColor Yellow
    Write-Host '  (Run ipconfig and look for IPv4 Address, e.g. 192.168.1.100)' -ForegroundColor Gray
    $networkIp = Read-Host '  IP address'
    $networkIp = $networkIp.Trim()
    if ([string]::IsNullOrWhiteSpace($networkIp)) {
        try {
            $addrs = [System.Net.Dns]::GetHostAddresses($env:COMPUTERNAME) | Where-Object { $_.AddressFamily -eq 'InterNetwork' -and $_.ToString() -notlike '127.*' }
            if ($addrs.Count -gt 0) { $networkIp = $addrs[0].ToString(); Write-Host ('  Using detected IP: ' + $networkIp) -ForegroundColor Gray }
        } catch {}
        if ([string]::IsNullOrWhiteSpace($networkIp)) {
            Write-Host '  Could not detect IP. Please run the script again and enter your IP (e.g. 192.168.1.100).' -ForegroundColor Red
            exit 1
        }
    }
    $baseUrl = "http://${networkIp}:4000"
    $frontendUrl = "http://${networkIp}:3000"
}

Write-Host ""
Write-Host '  Checking for processes using port 4000 (backend) and 3000 (frontend)...' -ForegroundColor Gray
Stop-ProcessOnPort -Port 4000
Stop-ProcessOnPort -Port 3000
Start-Sleep -Seconds 2
Write-Host ""

Write-Host ('  Backend will use:  ' + $baseUrl) -ForegroundColor Gray
Write-Host ('  Frontend will be:  ' + $frontendUrl) -ForegroundColor Gray
Write-Host ""

$backendCmd = "Set-Location '$BackendPath'; `$env:BASE_URL='$baseUrl'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

$frontendCmd = "Set-Location '$ProjectRoot'; npx serve"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host '  Started backend and frontend in separate windows.' -ForegroundColor Green
Write-Host ""
Write-Host '  For Stripe test payments, run in a THIRD terminal:' -ForegroundColor Yellow
Write-Host '    stripe listen --forward-to http://localhost:4000/api/webhook/stripe --events checkout.session.completed' -ForegroundColor White
Write-Host '  (Use your machine''s IP instead of localhost if webhooks come from Stripe via network.)' -ForegroundColor Gray
Write-Host ""

if ($mode -eq "N") {
    $msg = "============================================" + [Environment]::NewLine +
        "Message to send to testers on your network" + [Environment]::NewLine +
        "============================================" + [Environment]::NewLine + [Environment]::NewLine +
        "Checkout test - Peripartner" + [Environment]::NewLine + [Environment]::NewLine +
        "1. Open this link in your browser:" + [Environment]::NewLine +
        "   $frontendUrl" + [Environment]::NewLine + [Environment]::NewLine +
        '2. Click "Buy this", then "Pay with card (Stripe)".' + [Environment]::NewLine + [Environment]::NewLine +
        "3. On Stripe's page use this test card:" + [Environment]::NewLine +
        "   Card:   4242 4242 4242 4242" + [Environment]::NewLine +
        "   Expiry: 12/34 (or any future date)" + [Environment]::NewLine +
        "   CVC:    any 3 digits" + [Environment]::NewLine + [Environment]::NewLine +
        "4. Complete the payment." + [Environment]::NewLine + [Environment]::NewLine +
        '5. On the "Thanks for your payment" page, click "Download your PDF".' + [Environment]::NewLine +
        "   (One-time link, valid 24 hours.)" + [Environment]::NewLine + [Environment]::NewLine +
        "============================================"
    Write-Host $msg -ForegroundColor Cyan
    $msgFile = Join-Path $ProjectRoot "message-for-testers.txt"
    $msg | Set-Content -Path $msgFile -Encoding UTF8
    Write-Host '  Saved the same message to: message-for-testers.txt' -ForegroundColor Green
    Write-Host '  You can copy from that file and send it (e.g. by email or chat).' -ForegroundColor Gray
    Write-Host ""
    Write-Host '  Reminder: In Stripe Dashboard, set your Payment Link redirect to:' -ForegroundColor Yellow
    Write-Host ('  ' + $frontendUrl + '/success?session_id={CHECKOUT_SESSION_ID}') -ForegroundColor White
} else {
    Write-Host ('  Open in your browser:  ' + $frontendUrl) -ForegroundColor Cyan
    Write-Host '  Then go to checkout and pay with card 4242 4242 4242 4242' -ForegroundColor Gray
}

Write-Host ""
Write-Host '  Press Enter to close this window (backend and frontend will keep running).' -ForegroundColor Gray
Read-Host
