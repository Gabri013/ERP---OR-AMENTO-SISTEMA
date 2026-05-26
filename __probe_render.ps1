# Probe root
Write-Host '--- Root ---'
try {
    $r = Invoke-WebRequest -Uri 'https://erp-backend-evq2.onrender.com/' -TimeoutSec 20 -UseBasicParsing
    Write-Host 'Root status:' $r.StatusCode
    Write-Host 'Root body:' $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))
} catch {
    Write-Host 'Root error:' $_.Exception.Message
}

# Try login to see if auth route exists
Write-Host '--- Login ---'
try {
    $body = '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}'
    $lr = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/auth/login' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 20
    Write-Host 'Login success:' $lr.success
    Write-Host 'Token prefix:' $lr.data.token.Substring(0,20)
} catch {
    Write-Host 'Login error:' $_.Exception.Message
}
