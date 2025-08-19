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

Write-ColorOutput "CloudFlare SSL Setup fuer $Domain" "Blue"
Write-ColorOutput "=================================================" "Blue"

# Check if SSL directory exists
if (!(Test-Path $SSLPath)) {
    Write-ColorOutput "Erstelle SSL-Verzeichnis..." "Yellow"
    New-Item -ItemType Directory -Path $SSLPath -Force | Out-Null
    New-Item -ItemType Directory -Path "$SSLPath/live" -Force | Out-Null
    New-Item -ItemType Directory -Path "$SSLPath/live/$Domain" -Force | Out-Null
}

$CertPath = "$SSLPath/live/$Domain"

Write-ColorOutput "" "White"
Write-ColorOutput "CloudFlare Origin Certificate Setup" "Green"
Write-ColorOutput "========================================" "Green"

Write-ColorOutput "" "White"
Write-ColorOutput "Folge diesen Schritten in CloudFlare:" "Yellow"
Write-ColorOutput "" "White"
Write-ColorOutput "1. Gehe zu CloudFlare Dashboard -> SSL/TLS -> Origin Server" "Cyan"
Write-ColorOutput "2. Klicke 'Create Certificate'" "Cyan"
Write-ColorOutput "3. Waehle:" "Cyan"
Write-ColorOutput "    - Let CloudFlare generate a private key and a CSR" "White"
Write-ColorOutput "    - RSA (2048)" "White"
Write-ColorOutput "    - Certificate Validity: 15 years" "White"
Write-ColorOutput "    - Hostnames: $Domain, *.$Domain" "White"
Write-ColorOutput "" "White"
Write-ColorOutput "4. Klicke 'Next'" "Cyan"
Write-ColorOutput "5. Du erhaeltst 2 Texte:" "Cyan"
Write-ColorOutput "    - Origin Certificate (PEM format)" "White"
Write-ColorOutput "    - Private Key" "White"
Write-ColorOutput "" "White"
Write-ColorOutput "6. Kopiere die Inhalte in folgende Dateien:" "Cyan"

Write-ColorOutput "" "White"
Write-ColorOutput "Erstelle diese Dateien:" "Blue"

# Create placeholder files with instructions
$CertFile = "$CertPath/fullchain.pem"
$KeyFile = "$CertPath/privkey.pem"

$CertInstructions = @"
-----BEGIN CERTIFICATE-----
[HIER_CLOUDFLARE_ORIGIN_CERTIFICATE_EINFUEGEN]
-----END CERTIFICATE-----
"@

$KeyInstructions = @"
-----BEGIN PRIVATE KEY-----
[HIER_CLOUDFLARE_PRIVATE_KEY_EINFUEGEN]
-----END PRIVATE KEY-----
"@

Set-Content -Path $CertFile -Value $CertInstructions -Encoding UTF8
Set-Content -Path $KeyFile -Value $KeyInstructions -Encoding UTF8

Write-ColorOutput "Dateien erstellt:" "Green"
Write-ColorOutput "   Certificate: $CertFile" "Green"
Write-ColorOutput "   Private Key: $KeyFile" "Green"

Write-ColorOutput "" "White"
Write-ColorOutput "WICHTIG:" "Red"
Write-ColorOutput "   1. Bearbeite diese Dateien mit einem Texteditor" "Yellow"
Write-ColorOutput "   2. Ersetze die Platzhalter mit den echten CloudFlare-Werten" "Yellow"
Write-ColorOutput "   3. Losche die Kommentarzeilen" "Yellow"
Write-ColorOutput "   4. Speichere die Dateien" "Yellow"

Write-ColorOutput "" "White"
Write-ColorOutput "CloudFlare SSL-Modus konfigurieren:" "Blue"
Write-ColorOutput "   -> Gehe zu SSL/TLS -> Overview" "Yellow"
Write-ColorOutput "   -> Setze SSL-Modus auf: 'Full (strict)'" "Yellow"

Write-ColorOutput "" "White"
Write-ColorOutput "Nach dem Bearbeiten der Zertifikatsdateien:" "Green"
Write-ColorOutput "   .\start-production.ps1" "Green"

Write-ColorOutput "" "White"
Write-ColorOutput "Aktuelle Dateien zum Bearbeiten:" "Blue"
Write-ColorOutput "   notepad `"$CertFile`"" "Yellow"
Write-ColorOutput "   notepad `"$KeyFile`"" "Yellow"

Write-ColorOutput "" "White"
Write-ColorOutput "Deine externe IP-Adresse (fuer DNS A-Record):" "Magenta"
try {
    $externalIP = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5
    Write-ColorOutput "   IP: $externalIP" "Green"
    Write-ColorOutput "   Erstelle A-Record: $Domain -> $externalIP (Proxied aktiviert)" "Yellow"
} catch {
    Write-ColorOutput "   Konnte externe IP nicht ermitteln" "Red"
    Write-ColorOutput "   Fuehre aus: Invoke-RestMethod -Uri 'https://api.ipify.org'" "Yellow"
}

Write-ColorOutput "" "White"
Write-ColorOutput "Setup abgeschlossen! Bearbeite jetzt die .pem Dateien." "Green"
