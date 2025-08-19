#!/usr/bin/env pwsh
# Script to create CloudFlare SSL certificate files

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

$SSLPath = "ssl-data/live/$Domain"

# Create directories
Write-Host "📁 Erstelle SSL-Verzeichnisse..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $SSLPath -Force | Out-Null

Write-Host "`n🔐 CloudFlare Origin Certificate Setup für: $Domain" -ForegroundColor Green
Write-Host "=" * 50

# Instructions
Write-Host @"
📋 Anweisungen:

1️⃣  Gehe zu CloudFlare Dashboard:
    https://dash.cloudflare.com

2️⃣  Wähle deine Domain → SSL/TLS → Origin Server

3️⃣  Klicke "Create Certificate"

4️⃣  Konfiguration:
    ✅ Let CloudFlare generate a private key and a CSR
    🔐 Key type: RSA (2048)  
    📅 Validity: 15 years
    🌐 Hostnames: $Domain, *.$Domain

5️⃣  Nach "Create" erhältst du:
    - Origin Certificate (PEM format)
    - Private Key

6️⃣  Erstelle diese Dateien:
"@ -ForegroundColor Cyan

Write-Host "`n📄 Certificate Datei: $SSLPath/fullchain.pem" -ForegroundColor Yellow
Write-Host "🔑 Private Key Datei: $SSLPath/privkey.pem" -ForegroundColor Yellow

Write-Host "`n💡 Beispiel Certificate Inhalt:" -ForegroundColor Blue
Write-Host "-----BEGIN CERTIFICATE-----" -ForegroundColor Green
Write-Host "[CLOUDFLARE CERTIFICATE CONTENT]" -ForegroundColor Green  
Write-Host "-----END CERTIFICATE-----" -ForegroundColor Green

Write-Host "`n💡 Beispiel Private Key Inhalt:" -ForegroundColor Blue
Write-Host "-----BEGIN PRIVATE KEY-----" -ForegroundColor Green
Write-Host "[CLOUDFLARE PRIVATE KEY CONTENT]" -ForegroundColor Green
Write-Host "-----END PRIVATE KEY-----" -ForegroundColor Green

Write-Host "`n⚙️  SSL-Modus in CloudFlare setzen:" -ForegroundColor Magenta
Write-Host "   → SSL/TLS → Overview → Full (strict)" -ForegroundColor Yellow

Write-Host "`n🚀 Nach dem Erstellen der Dateien:" -ForegroundColor Green
Write-Host "   .\start-production.ps1" -ForegroundColor Yellow

# Create empty files as templates
$CertPath = "$SSLPath/fullchain.pem"
$KeyPath = "$SSLPath/privkey.pem"

New-Item -ItemType File -Path $CertPath -Force | Out-Null
New-Item -ItemType File -Path $KeyPath -Force | Out-Null

Write-Host "`n✅ Leere Template-Dateien erstellt:" -ForegroundColor Green
Write-Host "   📄 $CertPath" -ForegroundColor Green
Write-Host "   🔑 $KeyPath" -ForegroundColor Green

Write-Host "`n🚨 NÄCHSTE SCHRITTE:" -ForegroundColor Red
Write-Host "1. Hole die Zertifikate aus CloudFlare Dashboard" -ForegroundColor Yellow
Write-Host "2. Füge sie in die erstellten .pem Dateien ein" -ForegroundColor Yellow  
Write-Host "3. Speichere die Dateien" -ForegroundColor Yellow
Write-Host "4. Starte Production: .\start-production.ps1" -ForegroundColor Yellow
