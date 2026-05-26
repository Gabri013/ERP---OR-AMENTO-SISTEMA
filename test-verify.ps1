$r = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}'
$t = $r.data.token
$h = @{Authorization='Bearer '+$t}

try {
    $u = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/usuarios' -Headers $h
    Write-Host "USUARIOS success:" $u.success "count:" $u.data.Count
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    Write-Host "USUARIOS ERROR:" $reader.ReadToEnd()
}

try {
    $f = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/financeiro/contas-receber' -Headers $h
    Write-Host "FINANCEIRO success:" $f.success "total:" $f.data.Count
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    Write-Host "FINANCEIRO ERROR:" $reader.ReadToEnd()
}
