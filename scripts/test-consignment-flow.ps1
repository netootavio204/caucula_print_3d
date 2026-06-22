param([Parameter(Mandatory = $true)][string]$ServiceRoleKey)

$ErrorActionPreference = 'Stop'
$config = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') { $config[$matches[1]] = $matches[2] }
}
$root = $config['VITE_SUPABASE_URL'] -replace '/rest/v1/?$', ''
$anon = $config['VITE_SUPABASE_ANON_KEY']
$email = 'codex-consignment-' + [guid]::NewGuid().ToString('N') + '@example.com'
$password = 'Codex-V25-' + [guid]::NewGuid().ToString('N') + '!'
$serviceHeaders = @{ apikey = $ServiceRoleKey; Authorization = 'Bearer ' + $ServiceRoleKey; 'Content-Type' = 'application/json' }
$userId = $null

function Assert-Equal($Actual, $Expected, [string]$Label) {
  if ([decimal]$Actual -ne [decimal]$Expected) { throw "$Label expected=$Expected actual=$Actual" }
}
function Invoke-Api([string]$Method, [string]$Path, $Body = $null, $Headers = $script:userHeaders) {
  $params = @{ Uri = $root + $Path; Method = $Method; Headers = $Headers; TimeoutSec = 30 }
  if ($null -ne $Body) { $params.Body = ConvertTo-Json -InputObject $Body -Depth 12 -Compress }
  Invoke-RestMethod @params
}
function Assert-Rejected([scriptblock]$Action, [string]$Label) {
  try { & $Action; throw "$Label was accepted" } catch {
    if ($_.Exception.Message -like "$Label was accepted*") { throw }
  }
}

try {
  $created = Invoke-Api 'Post' '/auth/v1/admin/users' @{ email = $email; password = $password; email_confirm = $true } $serviceHeaders
  $userId = $created.id
  $session = Invoke-Api 'Post' '/auth/v1/token?grant_type=password' @{ email = $email; password = $password } @{ apikey = $anon; 'Content-Type' = 'application/json' }
  $script:userHeaders = @{ apikey = $anon; Authorization = 'Bearer ' + $session.access_token; 'Content-Type' = 'application/json'; Prefer = 'return=representation' }

  $client = @(Invoke-Api 'Post' '/rest/v1/clients' @{ user_id = $userId; name = 'Consignatario Teste V25'; client_type = 'consignatario' })[0]
  $stockId = Invoke-Api 'Post' '/rest/v1/rpc/save_ready_stock' @{ p_stock = @{ project_model_id = $null; name = 'Produto Teste V25'; quantity = 10; unit_cost = 5; sale_price = 15; image_url = ''; notes = '' }; p_deduct_materials = $false }
  $stock = @(Invoke-Api 'Get' "/rest/v1/ready_stock?id=eq.$stockId&select=*")[0]
  Assert-Equal $stock.quantity_internal 10 'v1_create.quantity_internal'
  $lotId = Invoke-Api 'Post' '/rest/v1/rpc/create_consignment' @{
    p_consignment = @{ consignee_client_id = $client.id; consignment_code = 'CONS-TEST-V25'; sent_date = (Get-Date -Format 'yyyy-MM-dd'); notes = 'Teste automatizado V2.5' }
    p_items = @(@{ ready_stock_id = $stock.id; quantity_sent = 6; consignment_unit_price = 12 })
  }
  $item = @(Invoke-Api 'Get' "/rest/v1/consignment_items?consignment_id=eq.$lotId&select=*")[0]
  $stockAfterCreate = @(Invoke-Api 'Get' "/rest/v1/ready_stock?id=eq.$($stock.id)&select=*")[0]
  Assert-Equal $stockAfterCreate.quantity_internal 4 'create.quantity_internal'
  Assert-Equal $stockAfterCreate.quantity_consigned 6 'create.quantity_consigned'
  Assert-Equal $item.quantity_remaining 6 'create.quantity_remaining'
  Assert-Equal $item.total_consigned_value 72 'create.total_consigned_value'

  Assert-Rejected { Invoke-Api 'Post' '/rest/v1/rpc/register_consignment_sale' @{ p_item_id = $item.id; p_quantity = 7 } } 'sale_over_remaining'
  Invoke-Api 'Post' '/rest/v1/rpc/register_consignment_sale' @{ p_item_id = $item.id; p_quantity = 2 } | Out-Null
  $item = @(Invoke-Api 'Get' "/rest/v1/consignment_items?id=eq.$($item.id)&select=*")[0]
  $stockAfterSale = @(Invoke-Api 'Get' "/rest/v1/ready_stock?id=eq.$($stock.id)&select=*")[0]
  Assert-Equal $stockAfterSale.quantity_consigned 4 'sale.quantity_consigned'
  Assert-Equal $stockAfterSale.quantity_sold 2 'sale.quantity_sold'
  Assert-Equal $item.quantity_remaining 4 'sale.quantity_remaining'
  Assert-Equal $item.sold_value 24 'sale.sold_value'
  Assert-Equal $item.open_value 24 'sale.open_value'

  Assert-Rejected { Invoke-Api 'Post' '/rest/v1/rpc/register_consignment_payment' @{ p_item_id = $item.id; p_amount = -1 } } 'negative_payment'
  Invoke-Api 'Post' '/rest/v1/rpc/register_consignment_payment' @{ p_item_id = $item.id; p_amount = 10; p_payment_method = 'pix'; p_payment_date = (Get-Date -Format 'yyyy-MM-dd'); p_notes = 'Parcial' } | Out-Null
  $item = @(Invoke-Api 'Get' "/rest/v1/consignment_items?id=eq.$($item.id)&select=*")[0]
  Assert-Equal $item.paid_value 10 'payment.paid_value'
  Assert-Equal $item.open_value 14 'payment.open_value'
  if ($item.status -ne 'parcialmente_pago') { throw "payment.status expected=parcialmente_pago actual=$($item.status)" }

  Assert-Rejected { Invoke-Api 'Post' '/rest/v1/rpc/register_consignment_return' @{ p_item_id = $item.id; p_quantity = 5 } } 'return_over_remaining'
  Invoke-Api 'Post' '/rest/v1/rpc/register_consignment_return' @{ p_item_id = $item.id; p_quantity = 1 } | Out-Null
  $item = @(Invoke-Api 'Get' "/rest/v1/consignment_items?id=eq.$($item.id)&select=*")[0]
  $lot = @(Invoke-Api 'Get' "/rest/v1/consignments?id=eq.$lotId&select=*")[0]
  $stockFinal = @(Invoke-Api 'Get' "/rest/v1/ready_stock?id=eq.$($stock.id)&select=*")[0]
  Assert-Equal $stockFinal.quantity_internal 5 'return.quantity_internal'
  Assert-Equal $stockFinal.quantity_consigned 3 'return.quantity_consigned'
  Assert-Equal $item.quantity_returned 1 'return.quantity_returned'
  Assert-Equal $item.quantity_remaining 3 'return.quantity_remaining'
  Assert-Equal $lot.total_consigned_value 72 'indicators.total_consigned'
  Assert-Equal $lot.total_sold_value 24 'indicators.total_sold'
  Assert-Equal $lot.total_paid_value 10 'indicators.total_paid'
  Assert-Equal $lot.total_open_value 14 'indicators.total_open'

  $payments = @(Invoke-Api 'Get' "/rest/v1/consignment_payments?consignment_id=eq.$lotId&select=*")
  $movements = @(Invoke-Api 'Get' "/rest/v1/ready_stock_movements?consignment_id=eq.$lotId&select=*")
  $paymentAmounts = @($payments | ForEach-Object { $_.amount })
  $movementTypes = @($movements | ForEach-Object { $_.movement_type })
  Assert-Equal $paymentAmounts.Count 1 'payment.history_count'
  if ($movementTypes -notcontains 'saida_consignacao') { throw 'movement.saida_consignacao missing' }
  if ($movementTypes -notcontains 'devolucao_consignacao') { throw 'movement.devolucao_consignacao missing' }
  $legacyStockId = Invoke-Api 'Post' '/rest/v1/rpc/save_ready_stock' @{ p_stock = @{ project_model_id = $null; name = 'Produto Legado Teste'; quantity = 4; unit_cost = 2; sale_price = 8; image_url = ''; notes = '' }; p_deduct_materials = $false }
  Invoke-Api 'Post' '/rest/v1/rpc/record_ready_stock_sale' @{ p_stock_id = $legacyStockId; p_quantity = 1 } | Out-Null
  $legacyStock = @(Invoke-Api 'Get' "/rest/v1/ready_stock?id=eq.$legacyStockId&select=*")[0]
  Assert-Equal $legacyStock.quantity 3 'v1_sale.quantity'
  Assert-Equal $legacyStock.quantity_internal 3 'v1_sale.quantity_internal'
  Assert-Equal $legacyStock.quantity_sold 1 'v1_sale.quantity_sold'
  Write-Output 'v2_5_consignment_flow=ok'
  Write-Output 'create_lot=ok; stock_send=ok; consigned_sale=ok; partial_payment=ok; return=ok; indicators=ok; guards=ok; v1_stock=ok'
}
finally {
  if ($userId) { Invoke-Api 'Delete' "/auth/v1/admin/users/$userId" $null $serviceHeaders | Out-Null }
}
