$ErrorActionPreference = 'Continue'
$base = 'https://erp-backend-evq2.onrender.com/api'

# Login
Write-Host '=== LOGIN ==='
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body '{"email":"admin@cozinca.com","senha":"Cozinca@2026"}' -ErrorAction Stop
$t = $login.data.token
$h = @{Authorization='Bearer '+$t; 'Content-Type'='application/json'}
Write-Host '=== LOGIN OK ===' $t.Substring(0,20)

# Test 1: Create cliente
Write-Host ''
Write-Host '=== TEST 1: POST /clientes ==='
try {
  $body = '{"razaoSocial":"TESTE CLIENTE REVISAO","cnpjCpf":"12.345.678/0001-99","cidade":"Sao Paulo","estado":"SP"}'
  $r = Invoke-RestMethod -Uri "$base/clientes" -Method POST -Headers $h -Body $body -ErrorAction Stop
  Write-Host 'CREATE CLIENTE SUCCESS: success=' $r.success ' id=' $r.data.id
  if ($r.data.id) {
    Invoke-RestMethod -Uri "$base/clientes/$($r.data.id)" -Method DELETE -Headers $h | Out-Null
    Write-Host '(cleanup: deleted test client)'
  }
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host 'CREATE CLIENTE ERROR:' $reader.ReadToEnd()
  } else {
    Write-Host 'CREATE CLIENTE EXCEPTION:' $_.Exception.Message
  }
}

# Test 2: GET /vendas
Write-Host ''
Write-Host '=== TEST 2: GET /vendas ==='
$vendas = Invoke-RestMethod -Uri "$base/vendas" -Headers $h
Write-Host 'vendas total:' $vendas.meta.total
if ($vendas.data.Count -gt 0) {
  $v0 = $vendas.data[0]
  Write-Host 'First venda  id:' $v0.id '  numero:' $v0.numero '  clienteId:' $v0.clienteId
}

# Test 3: GET /os
Write-Host ''
Write-Host '=== TEST 3: GET /os ==='
$osList = Invoke-RestMethod -Uri "$base/os" -Headers $h
Write-Host 'total OS:' $osList.meta.total
$vendasComOS = @()
if ($osList.data) {
  $vendasComOS = $osList.data | ForEach-Object { $_.vendaId } | Sort-Object -Unique
  Write-Host 'vendas com OS:' $vendasComOS.Count ($vendasComOS -join ', ')
}

# Test 4: Gerar OS for venda id=1
Write-Host ''
Write-Host '=== TEST 4: POST /vendas/1/gerar-os ==='
try {
  $r2 = Invoke-RestMethod -Uri "$base/vendas/1/gerar-os" -Method POST -Headers $h -ErrorAction Stop
  Write-Host 'GERAR-OS SUCCESS: numero=' $r2.data.numero
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host 'GERAR-OS ERROR:' $reader.ReadToEnd()
  } else {
    Write-Host 'GERAR-OS EXCEPTION:' $_.Exception.Message
  }
}

# Test 5: Create fresh venda, then gerar OS
Write-Host ''
Write-Host '=== TEST 5: Create venda then gerar OS ==='
$clientes = Invoke-RestMethod -Uri "$base/clientes" -Headers $h
$clienteId = $clientes.data[0].id
Write-Host 'Using clienteId:' $clienteId

$vendaBody = '{"clienteId":' + $clienteId + ',"dataVenda":"2026-05-26","valorTotal":1000,"itens":[{"descricaoManual":"Produto Teste","quantidade":1,"valorUnitario":1000}]}'
Write-Host 'vendaBody:' $vendaBody

try {
  $novaVenda = Invoke-RestMethod -Uri "$base/vendas" -Method POST -Headers $h -Body $vendaBody -ErrorAction Stop
  Write-Host 'CREATE VENDA SUCCESS: id=' $novaVenda.data.id ' numero=' $novaVenda.data.numero
  $newId = $novaVenda.data.id
  try {
    $osR = Invoke-RestMethod -Uri "$base/vendas/$newId/gerar-os" -Method POST -Headers $h -ErrorAction Stop
    Write-Host 'GERAR OS SUCCESS: numero=' $osR.data.numero ' etapas=' $osR.data.itens.Count
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $stream = $resp.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      Write-Host 'GERAR OS ERROR:' $reader.ReadToEnd()
    } else {
      Write-Host 'GERAR OS EXCEPTION:' $_.Exception.Message
    }
  }
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host 'CREATE VENDA ERROR:' $reader.ReadToEnd()
  } else {
    Write-Host 'CREATE VENDA EXCEPTION:' $_.Exception.Message
  }
}

Write-Host ''
Write-Host '=== DONE ==='
