param([Parameter(Mandatory = $true)][string]$ManagementToken)

$ErrorActionPreference = 'Stop'
$config = @{}
Get-Content .env | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { $config[$matches[1]] = $matches[2].Trim() } }
$root = $config['VITE_SUPABASE_URL'] -replace '/rest/v1/?$', ''
$anon = $config['VITE_SUPABASE_ANON_KEY']
$email = 'codex-v26-' + [guid]::NewGuid().ToString('N') + '@example.com'
$password = 'Codex-V26-' + [guid]::NewGuid().ToString('N') + '!'
$userId = $null
$image1Path = $null
$image2Path = $null
$accessToken = $null
$png = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')

function Invoke-Json([string]$Method, [string]$Uri, $Headers, $Body = $null) {
  $params = @{ Uri = $Uri; Method = $Method; Headers = $Headers; TimeoutSec = 30 }
  if ($null -ne $Body) { $params.Body = ConvertTo-Json -InputObject $Body -Depth 10 -Compress; $params.ContentType = 'application/json' }
  Invoke-RestMethod @params
}
function Invoke-ManagementSql([string]$Sql) {
  Invoke-Json 'Post' 'https://api.supabase.com/v1/projects/pinkyudmrpahhbqzedqz/database/query' @{ Authorization = 'Bearer ' + $ManagementToken } @{ query = $Sql }
}

try {
  $signup = Invoke-Json 'Post' ($root + '/auth/v1/signup') @{ apikey = $anon } @{ email = $email; password = $password; data = @{ full_name = 'Teste V26' } }
  $userId = $signup.user.id
  if (-not $userId) { throw 'Signup did not return a user' }
  if (-not $signup.access_token) {
    Invoke-ManagementSql "update auth.users set email_confirmed_at=coalesce(email_confirmed_at,now()) where id='$userId'::uuid;" | Out-Null
  }
  $session = Invoke-Json 'Post' ($root + '/auth/v1/token?grant_type=password') @{ apikey = $anon } @{ email = $email; password = $password }
  $accessToken = $session.access_token
  if (-not $accessToken) { throw 'Login did not return an access token' }
  $userHeaders = @{ apikey = $anon; Authorization = 'Bearer ' + $accessToken; Prefer = 'return=representation' }
  $loggedUser = Invoke-Json 'Get' ($root + '/auth/v1/user') $userHeaders
  if ($loggedUser.id -ne $userId) { throw 'Authenticated user mismatch' }

  $stockId = Invoke-Json 'Post' ($root + '/rest/v1/rpc/save_ready_stock') $userHeaders @{ p_stock = @{ name = 'Produto Publico Teste V26'; quantity = 2; unit_cost = 3; sale_price = 9; image_url = ''; notes = '' }; p_deduct_materials = $false }
  $code = 'PUBLIC-' + $userId.Substring(0, 8).ToUpperInvariant()
  Invoke-Json 'Patch' ($root + "/rest/v1/ready_stock?id=eq.$stockId") $userHeaders @{ public_code = $code; public_name = 'Produto Publico V26'; public_description = 'Descricao publica de teste'; category = 'Teste' } | Out-Null

  $image1Path = "$userId/$code/image-1.png"
  $image2Path = "$userId/$code/image-2.png"
  foreach ($path in @($image1Path, $image2Path)) {
    $encoded = ($path -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    Invoke-WebRequest -Uri ($root + '/storage/v1/object/catalog-products/' + $encoded) -Method Post -Headers @{ apikey = $anon; Authorization = 'Bearer ' + $accessToken } -ContentType 'image/png' -Body $png -UseBasicParsing -TimeoutSec 30 | Out-Null
  }
  $url1 = $root + '/storage/v1/object/public/catalog-products/' + (($image1Path -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/')
  $url2 = $root + '/storage/v1/object/public/catalog-products/' + (($image2Path -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/')
  Invoke-Json 'Patch' ($root + "/rest/v1/ready_stock?id=eq.$stockId") $userHeaders @{ catalog_image_1_path = $image1Path; catalog_image_1_url = $url1; catalog_image_2_path = $image2Path; catalog_image_2_url = $url2; is_catalog_visible = $true } | Out-Null

  $publicRows = Invoke-Json 'Get' ($root + "/rest/v1/public_catalog_view?id=eq.$stockId&select=*") @{ apikey = $anon }
  if ($publicRows.Count -ne 1) { throw 'Published product is not publicly visible' }
  $forbidden = @('unit_cost','sale_price','direct_sale_price','consignment_price','quantity','quantity_internal','quantity_consigned','quantity_sold','notes')
  foreach ($field in $forbidden) { if ($publicRows[0].PSObject.Properties.Name -contains $field) { throw "Public catalog exposed $field" } }
  if ((Invoke-WebRequest -Uri $url1 -UseBasicParsing -TimeoutSec 30).StatusCode -ne 200) { throw 'Public image is not readable' }

  $encoded1 = ($image1Path -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
  Invoke-WebRequest -Uri ($root + '/storage/v1/object/catalog-products/' + $encoded1) -Method Post -Headers @{ apikey = $anon; Authorization = 'Bearer ' + $accessToken; 'x-upsert' = 'true' } -ContentType 'image/png' -Body $png -UseBasicParsing -TimeoutSec 30 | Out-Null
  $encoded2 = ($image2Path -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
  Invoke-WebRequest -Uri ($root + '/storage/v1/object/catalog-products/' + $encoded2) -Method Delete -Headers @{ apikey = $anon; Authorization = 'Bearer ' + $accessToken } -UseBasicParsing -TimeoutSec 30 | Out-Null
  $image2Path = $null
  Write-Output 'login_catalog_upload_replace_remove_public=ok'
}
finally {
  if ($accessToken) {
    foreach ($path in @($image1Path, $image2Path)) {
      if ($path) {
        $encoded = ($path -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
        try { Invoke-WebRequest -Uri ($root + '/storage/v1/object/catalog-products/' + $encoded) -Method Delete -Headers @{ apikey = $anon; Authorization = 'Bearer ' + $accessToken } -UseBasicParsing -TimeoutSec 30 | Out-Null } catch {}
      }
    }
  }
  if ($userId) { Invoke-ManagementSql "delete from auth.users where id='$userId'::uuid;" | Out-Null }
}
