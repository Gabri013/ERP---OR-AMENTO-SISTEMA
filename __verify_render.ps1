$r = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}'
$t = $r.data.token
$h = @{ Authorization = 'Bearer ' + $t }

$u = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/usuarios' -Headers $h
Write-Host "USUARIOS  success:" $u.success "count:" $u.data.Count

$f = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/financeiro/contas-receber' -Headers $h
Write-Host "FINANCEIRO success:" $f.success "total:" $f.meta.total

$c = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/clientes' -Headers $h
Write-Host "CLIENTES  success:" $c.success "total:" $c.meta.total
