# CloudFlare SSL Setup Script for Requiem Manager

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    [string]$SSLPath = "ssl-data"
)

# Colors for output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    switch ($Color) {
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        "Magenta" { Write-Host $Message -ForegroundColor Magenta }
        default { Write-Host $Message }
    }
}

Write-ColorOutput "CloudFlare SSL Setup for $Domain" "Blue"
Write-ColorOutput "=================================================" "Blue"

# Check if SSL directory exists
if (!(Test-Path $SSLPath)) {
    Write-ColorOutput "Creating SSL directory..." "Yellow"
    New-Item -ItemType Directory -Path $SSLPath -Force | Out-Null
    New-Item -ItemType Directory -Path "$SSLPath/live" -Force | Out-Null
    New-Item -ItemType Directory -Path "$SSLPath/live/$Domain" -Force | Out-Null
}

$CertPath = "$SSLPath/live/$Domain"

Write-ColorOutput "" "White"
Write-ColorOutput "CloudFlare Origin Certificate Setup" "Green"
Write-ColorOutput "========================================" "Green"

Write-ColorOutput "" "White"
Write-ColorOutput "Follow these steps in CloudFlare:" "Yellow"
Write-ColorOutput "" "White"
Write-ColorOutput "1. Go to CloudFlare Dashboard -> SSL/TLS -> Origin Server" "Cyan"
Write-ColorOutput "2. Click 'Create Certificate'" "Cyan"
Write-ColorOutput "3. Select:" "Cyan"
Write-ColorOutput "    - Let CloudFlare generate a private key and a CSR" "White"
Write-ColorOutput "    - RSA (2048)" "White"
Write-ColorOutput "    - Certificate Validity: 15 years" "White"
Write-ColorOutput "    - Hostnames: $Domain, *.$Domain" "White"
Write-ColorOutput "" "White"
Write-ColorOutput "4. Click 'Next'" "Cyan"
Write-ColorOutput "5. You will receive 2 texts:" "Cyan"
Write-ColorOutput "    - Origin Certificate (PEM format)" "White"
Write-ColorOutput "    - Private Key" "White"
Write-ColorOutput "" "White"
Write-ColorOutput "6. Copy the contents into the following files:" "Cyan"

Write-ColorOutput "" "White"
Write-ColorOutput "Creating these files:" "Blue"

# Create placeholder files with instructions
$CertFile = "$CertPath/fullchain.pem"
$KeyFile = "$CertPath/privkey.pem"

$CertInstructions = @"
-----BEGIN CERTIFICATE-----
[PASTE_CLOUDFLARE_ORIGIN_CERTIFICATE_HERE]
-----END CERTIFICATE-----
"@

$KeyInstructions = @"
-----BEGIN PRIVATE KEY-----
[PASTE_CLOUDFLARE_PRIVATE_KEY_HERE]
-----END PRIVATE KEY-----
"@

Set-Content -Path $CertFile -Value $CertInstructions -Encoding UTF8
Set-Content -Path $KeyFile -Value $KeyInstructions -Encoding UTF8

Write-ColorOutput "Files created:" "Green"
Write-ColorOutput "   Certificate: $CertFile" "Green"
Write-ColorOutput "   Private Key: $KeyFile" "Green"

Write-ColorOutput "" "White"
Write-ColorOutput "IMPORTANT:" "Red"
Write-ColorOutput "   1. Edit these files with a text editor" "Yellow"
Write-ColorOutput "   2. Replace the placeholders with the real CloudFlare values" "Yellow"
Write-ColorOutput "   3. Remove the comment lines" "Yellow"
Write-ColorOutput "   4. Save the files" "Yellow"

Write-ColorOutput "" "White"
Write-ColorOutput "Configure CloudFlare SSL Mode:" "Blue"
Write-ColorOutput "   -> Go to SSL/TLS -> Overview" "Yellow"
Write-ColorOutput "   -> Set SSL mode to: 'Full (strict)'" "Yellow"

Write-ColorOutput "" "White"
Write-ColorOutput "After editing the certificate files:" "Green"
Write-ColorOutput "   .\start-production.ps1" "Green"

Write-ColorOutput "" "White"
Write-ColorOutput "Current files to edit:" "Blue"
Write-ColorOutput "   notepad `"$CertFile`"" "Yellow"
Write-ColorOutput "   notepad `"$KeyFile`"" "Yellow"

Write-ColorOutput "" "White"
Write-ColorOutput "Your external IP address (for DNS A-Record):" "Magenta"
try {
    $externalIP = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5
    Write-ColorOutput "   IP: $externalIP" "Green"
    Write-ColorOutput "   Create A-Record: $Domain -> $externalIP (Proxied enabled)" "Yellow"
} catch {
    Write-ColorOutput "   Could not determine external IP" "Red"
    Write-ColorOutput "   Run: Invoke-RestMethod -Uri 'https://api.ipify.org'" "Yellow"
}

Write-ColorOutput "" "White"
Write-ColorOutput "Setup completed! Now edit the .pem files." "Green"
