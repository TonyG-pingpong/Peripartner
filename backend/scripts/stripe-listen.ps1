# Forward Stripe webhooks to local backend for testing.
# Requires: Stripe CLI installed and logged in (stripe login).
# Run the backend first: npm start
# Then run this script and set STRIPE_WEBHOOK_SECRET in .env to the whsec_... value printed below.

$port = if ($env:PORT) { $env:PORT } else { "4000" }
$url = "http://localhost:$port/api/webhook/stripe"
Write-Host "Forwarding Stripe webhooks to $url" -ForegroundColor Cyan
Write-Host "Copy the webhook signing secret (whsec_...) into .env as STRIPE_WEBHOOK_SECRET" -ForegroundColor Yellow
Write-Host ""
stripe listen --forward-to $url
