# Simple SSL Certificate Fix
$Domain = "requiem.niklasky.com"

Write-Host "Fixing SSL for: $Domain" -ForegroundColor Cyan

$certDir = "ssl-data\conf\live\$Domain"
$archiveDir = "ssl-data\conf\archive\$Domain"

# Check archive directory
if (Test-Path $archiveDir) {
    Write-Host "Found archive directory" -ForegroundColor Green
    Get-ChildItem $archiveDir
    
    # Copy files if they exist
    $files = @(
        @{source="cert1.pem"; target="cert.pem"},
        @{source="chain1.pem"; target="chain.pem"},
        @{source="fullchain1.pem"; target="fullchain.pem"},
        @{source="privkey1.pem"; target="privkey.pem"}
    )
    
    foreach ($file in $files) {
        $sourcePath = Join-Path $archiveDir $file.source
        $targetPath = Join-Path $certDir $file.target
        
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $targetPath -Force
            Write-Host "Copied: $($file.source) to $($file.target)" -ForegroundColor Green
        } else {
            Write-Host "Missing: $($file.source)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Archive directory not found: $archiveDir" -ForegroundColor Red
    Write-Host "Need to regenerate SSL certificate" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Check certificate files:" -ForegroundColor Yellow
Get-ChildItem $certDir | Format-Table Name, Length
