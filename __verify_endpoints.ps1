$ErrorActionPreference = 'Continue'

# Login
try {
    $r = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}' -TimeoutSec 30
    $t = $r.data.token
    $h = @{Authorization='Bearer '+$t}
    Write-Host 'Login: OK token prefix:' $t.Substring(0,20)
} catch {
    Write-Host 'Login ERROR:' $_.Exception.Message; exit 1
}

# KANBAN
Write-Host '--- KANBAN ---'
try {
    $k = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/kanban/producao' -Headers $h -TimeoutSec 20
    Write-Host 'success:' $k.success
    $cols = $k.data | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
    Write-Host 'colunas:' ($cols -join ',')
} catch { Write-Host 'KANBAN ERROR:' $_.Exception.Message }

# List OS to get a valid ID
Write-Host '--- OS LIST ---'
try {
    $os = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/os?limit=3' -Headers $h -TimeoutSec 20
    Write-Host 'OS list success:' $os.success 'count:' $os.data.Count
    if ($os.data.Count -gt 0) {
        $osId = $os.data[0].id
        Write-Host 'First OS id:' $osId
    }
} catch { Write-Host 'OS LIST ERROR:' $_.Exception.Message; $osId = 1 }

# CHECKLIST
Write-Host '--- CHECKLIST OS' $osId '---'
try {
    $c = Invoke-RestMethod -Uri "https://erp-backend-evq2.onrender.com/api/os/$osId/checklist" -Headers $h -TimeoutSec 20
    Write-Host 'checklist success:' $c.success 'items:' $c.data.Count
} catch { Write-Host 'CHECKLIST ERROR:' $_.Exception.Message }

# EXPORT
Write-Host '--- EXPORT ---'
try {
    $e = Invoke-WebRequest -Uri 'https://erp-backend-evq2.onrender.com/api/export/os' -Headers $h -TimeoutSec 20 -UseBasicParsing
    Write-Host 'export status:' $e.StatusCode 'content-type:' $e.Headers.'Content-Type'
} catch { Write-Host 'EXPORT ERROR:' $_.Exception.Message }
