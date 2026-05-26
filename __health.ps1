try {
    $h = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/health' -TimeoutSec 20
    Write-Host 'Health OK'
    Write-Host ($h | ConvertTo-Json -Compress)
} catch {
    Write-Host 'Health error:' $_.Exception.Message
}
