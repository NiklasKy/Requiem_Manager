# Fix SSL Certificate Symlinks
param([string]$Domain = "requiem.niklasky.com")

Write-Host "🔧 Fixing SSL Certificate Symlinks for: $Domain" -ForegroundColor Cyan
Write-Host ""

$certDir = "ssl-data\conf\live\$Domain"
$archiveDir = "ssl-data\conf\archive\$Domain"

# Check if certificates exist in archive
if (Test-Path $archiveDir) {
    Write-Host "✅ Found archive directory: $archiveDir" -ForegroundColor Green
    
    # List archive contents
    $archiveFiles = Get-ChildItem $archiveDir -ErrorAction SilentlyContinue
    if ($archiveFiles) {
        Write-Host "Archive contains:" -ForegroundColor Yellow
        $archiveFiles | ForEach-Object { Write-Host "  - $($_.Name) ($($_.Length) bytes)" -ForegroundColor White }
        
        # Copy latest certificates to live directory
        $certFiles = @("cert1.pem", "chain1.pem", "fullchain1.pem", "privkey1.pem")
        $targetFiles = @("cert.pem", "chain.pem", "fullchain.pem", "privkey.pem")
        
        for ($i = 0; $i -lt $certFiles.Length; $i++) {
            $sourceFile = Join-Path $archiveDir $certFiles[$i]
            $targetFile = Join-Path $certDir $targetFiles[$i]
            
            if (Test-Path $sourceFile) {
                Copy-Item $sourceFile $targetFile -Force
                Write-Host "✅ Copied $($certFiles[$i]) → $($targetFiles[$i])" -ForegroundColor Green
            } else {
                Write-Host "❌ Missing: $($certFiles[$i])" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "🎉 SSL certificates fixed! Restart containers:" -ForegroundColor Green
        Write-Host "docker-compose -f docker-compose.prod.yml restart nginx" -ForegroundColor White
        
    } else {
        Write-Host "❌ Archive directory is empty" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Archive directory not found: $archiveDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solution: Regenerate SSL certificates:" -ForegroundColor Yellow
    Write-Host ".\setup-ssl.ps1 $Domain" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Alternative: Use CloudFlare SSL" -ForegroundColor Cyan
Write-Host "This avoids Let's Encrypt symlink issues completely." -ForegroundColor Gray
