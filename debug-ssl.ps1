# Debug SSL Certificate Locations
param(
    [Parameter(Mandatory=$false)]
    [string]$Domain = "requiem.niklasky.com"
)

Write-Host "🔍 SSL Certificate Debug for: $Domain" -ForegroundColor Cyan
Write-Host ""

# Check all possible SSL locations
$sslLocations = @(
    "ssl-data\conf\live\$Domain",
    "ssl-data\conf\live\$Domain\fullchain.pem",
    "ssl-data\conf\live\$Domain\privkey.pem", 
    "ssl-data\conf\live\$Domain\cert.pem",
    "ssl-data\conf\live\$Domain\chain.pem",
    "C:\Certbot\live\$Domain\fullchain.pem",
    "ssl-data\conf",
    "ssl-data"
)

foreach ($location in $sslLocations) {
    $exists = Test-Path $location
    $type = if (Test-Path $location -PathType Container) { "Directory" } else { "File" }
    $status = if ($exists) { "✅ EXISTS" } else { "❌ NOT FOUND" }
    $color = if ($exists) { "Green" } else { "Red" }
    
    Write-Host "$status $type : $location" -ForegroundColor $color
    
    if ($exists -and $type -eq "Directory") {
        try {
            $items = Get-ChildItem $location -ErrorAction SilentlyContinue
            foreach ($item in $items) {
                Write-Host "    └── $($item.Name)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "    └── (could not list contents)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🐳 Docker SSL Data Check:" -ForegroundColor Cyan
try {
    $dockerVolume = docker volume ls | Select-String "ssl"
    if ($dockerVolume) {
        Write-Host "Docker volumes with 'ssl':" -ForegroundColor Yellow
        $dockerVolume | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    } else {
        Write-Host "No Docker volumes found with 'ssl'" -ForegroundColor Gray
    }
} catch {
    Write-Host "Could not check Docker volumes" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Current Directory Contents:" -ForegroundColor Cyan
Get-ChildItem -Name | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

Write-Host ""
Write-Host "🔧 Recommended Actions:" -ForegroundColor Yellow
if (Test-Path "ssl-data\conf\live\$Domain\fullchain.pem") {
    Write-Host "✅ SSL certificate exists! The start script should find it." -ForegroundColor Green
} else {
    Write-Host "❌ SSL certificate missing. Run:" -ForegroundColor Red
    Write-Host "   .\setup-ssl.ps1 $Domain" -ForegroundColor White
}
