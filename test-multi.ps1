$r = Invoke-RestMethod -Uri 'https://erp-backend-evq2.onrender.com/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}'
$t = $r.data.token
$h = @{Authorization='Bearer '+$t}

$endpoints = @(
  'https://erp-backend-evq2.onrender.com/api/clientes',
  'https://erp-backend-evq2.onrender.com/api/produtos',
  'https://erp-backend-evq2.onrender.com/api/orcamentos',
  'https://erp-backend-evq2.onrender.com/api/vendas',
  'https://erp-backend-evq2.onrender.com/api/os',
  'https://erp-backend-evq2.onrender.com/api/usuarios',
  'https://erp-backend-evq2.onrender.com/api/financeiro/contas-receber',
  'https://erp-backend-evq2.onrender.com/api/financeiro/contas-pagar'
)

foreach ($ep in $endpoints) {
  $name = $ep -replace '.*api/', ''
  try {
    $res = Invoke-RestMethod -Uri $ep -Headers $h
    Write-Host "OK  $name - success=$($res.success) dataCount=$($res.data.Count)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $body = $reader.ReadToEnd()
    Write-Host "ERR $name - HTTP $code : $body"
  }
}
