# Check backend health
try {
    $h = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/health' -TimeoutSec 20
    Write-Host 'Health OK:' ($h | ConvertTo-Json -Compress)
} catch {
    Write-Host 'Health error:' $_.Exception.Message
}

# Check Vercel deployment
try {
    $headers = @{Authorization='Bearer $env:VERCEL_TOKEN'}
    $v = Invoke-RestMethod -Uri 'https://api.vercel.com/v6/deployments?projectId=prj_UTvSatFxMhLFaHoCvpPpGlvcFbZw&limit=1' -Headers $headers
    $dep = $v.deployments[0]
    Write-Host 'Vercel state:' $dep.state
    Write-Host 'Vercel created:' $dep.createdAt
    Write-Host 'Vercel url:' $dep.url
} catch {
    Write-Host 'Vercel error:' $_.Exception.Message
}
