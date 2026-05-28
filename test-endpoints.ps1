$r = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}'
$t = $r.data.token
$h = @{Authorization='Bearer '+$t}

Write-Host "Token obtained: $($t.Substring(0,20))..."

try {
    $u = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/usuarios' -Headers $h
    Write-Host "USUARIOS success:" $u.success "count:" $u.data.Count
} catch {
    Write-Host "USUARIOS ERROR:" $_.Exception.Message
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    Write-Host $reader.ReadToEnd()
}

try {
    $f = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/financeiro/contas-receber' -Headers $h
    Write-Host "FINANCEIRO success:" $f.success "count:" $f.data.Count
} catch {
    Write-Host "FINANCEIRO ERROR:" $_.Exception.Message
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    Write-Host $reader.ReadToEnd()
}
