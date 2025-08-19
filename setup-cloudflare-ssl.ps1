#!/usr/bin/env pwsh
# CloudFlare SSL Setup Script for Requiem Manager
# This script helps you set up CloudFlare Origin Certificates

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    [string]$SSLPath = "ssl-data"
)

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "${Color}${Message}${Reset}"
}

Write-ColorOutput "🚀 CloudFlare SSL Setup für $Domain" $Blue
Write-ColorOutput "=" * 50 $Blue

# Check if SSL directory exists
if (!(Test-Path $SSLPath)) {
    Write-ColorOutput "📁 Erstelle SSL-Verzeichnis..." $Yellow
    New-Item -ItemType Directory -Path $SSLPath -Force | Out-Null
    New-Item -ItemType Directory -Path "$SSLPath/live" -Force | Out-Null
    New-Item -ItemType Directory -Path "$SSLPath/live/$Domain" -Force | Out-Null
}

$CertPath = "$SSLPath/live/$Domain"

Write-ColorOutput "`n🔐 CloudFlare Origin Certificate Setup" $Green
Write-ColorOutput "=" * 40 $Green

$instructions = @"
📋 Folge diesen Schritten in CloudFlare:

1️⃣  Gehe zu CloudFlare Dashboard → SSL/TLS → Origin Server
2️⃣  Klicke "Create Certificate" 
3️⃣  Wähle:
    ✅ Let CloudFlare generate a private key and a CSR
    ✅ RSA (2048)
    📅 Certificate Validity: 15 years
    🌐 Hostnames: $Domain, *.$Domain

4️⃣  Klicke "Next"
5️⃣  Du erhältst 2 Texte:
    - Origin Certificate (PEM format)
    - Private Key

6️⃣  Kopiere die Inhalte in folgende Dateien:
"@

Write-ColorOutput $instructions $Yellow

Write-ColorOutput "`n📄 Erstelle diese Dateien:" $Blue

# Create placeholder files with instructions
$CertFile = "$CertPath/fullchain.pem"
$KeyFile = "$CertPath/privkey.pem"

$CertInstructions = @"
# CloudFlare Origin Certificate
# Kopiere hier den "Origin Certificate" Text aus CloudFlare
# Beginnt mit: -----BEGIN CERTIFICATE-----
# Endet mit: -----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
[HIER_CLOUDFLARE_ORIGIN_CERTIFICATE_EINFÜGEN]
-----END CERTIFICATE-----
"@

$KeyInstructions = @"
# CloudFlare Private Key  
# Kopiere hier den "Private Key" Text aus CloudFlare
# Beginnt mit: -----BEGIN PRIVATE KEY-----
# Endet mit: -----END PRIVATE KEY-----

-----BEGIN PRIVATE KEY-----
[HIER_CLOUDFLARE_PRIVATE_KEY_EINFÜGEN]
-----END PRIVATE KEY-----
"@

Set-Content -Path $CertFile -Value $CertInstructions -Encoding UTF8
Set-Content -Path $KeyFile -Value $KeyInstructions -Encoding UTF8

Write-ColorOutput "✅ Dateien erstellt:" $Green
Write-ColorOutput "   📄 Certificate: $CertFile" $Green  
Write-ColorOutput "   🔑 Private Key: $KeyFile" $Green

Write-ColorOutput "`n⚠️  WICHTIG:" $Red
Write-ColorOutput "   1. Bearbeite diese Dateien mit einem Texteditor" $Yellow
Write-ColorOutput "   2. Ersetze die Platzhalter mit den echten CloudFlare-Werten" $Yellow
Write-ColorOutput "   3. Lösche die Kommentarzeilen (# ...)" $Yellow
Write-ColorOutput "   4. Speichere die Dateien" $Yellow

Write-ColorOutput "`n🔧 CloudFlare SSL-Modus konfigurieren:" $Blue
Write-ColorOutput "   → Gehe zu SSL/TLS → Overview" $Yellow
Write-ColorOutput "   → Setze SSL-Modus auf: 'Full (strict)'" $Yellow

Write-ColorOutput "`n🚀 Nach dem Bearbeiten der Zertifikatsdateien:" $Green
Write-ColorOutput "   .\start-production.ps1 -Domain $Domain" $Green

Write-ColorOutput "`n📋 Aktuelle Dateien zum Bearbeiten:" $Blue
Write-ColorOutput "   notepad `"$CertFile`"" $Yellow
Write-ColorOutput "   notepad `"$KeyFile`"" $Yellow
