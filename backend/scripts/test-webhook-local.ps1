# Test webhook locally (no payment). Requires backend running: npm start
$url = "http://localhost:4000/api/webhook/gumroad"
$body = '{"email":"test@example.com","name":"Test Buyer"}'

Write-Host "POST to webhook..." -ForegroundColor Cyan
try {
  $response = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body $body
  Write-Host "Success!" -ForegroundColor Green
  Write-Host "Download URL (valid 24h, one-time use):" -ForegroundColor Yellow
  Write-Host $response.downloadUrl
  Write-Host ""
  Write-Host "Open the URL above in your browser to download the watermarked PDF." -ForegroundColor Gray
  Write-Host "Expires: $($response.expiresAt)" -ForegroundColor Gray
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
  }
}
