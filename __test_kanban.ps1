$r = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}'
$t = $r.data.token
$h = @{Authorization='Bearer '+$t}
$k = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/kanban/producao' -Headers $h
Write-Host 'KANBAN success:' $k.success
$cols = $k.data | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
Write-Host 'Colunas:' ($cols -join ', ')
foreach($col in $cols) {
    Write-Host "$col : $($k.data.$col.Count) OS"
}
