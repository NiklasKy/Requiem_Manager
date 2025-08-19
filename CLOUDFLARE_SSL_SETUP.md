# 🚀 CloudFlare SSL Setup für Requiem Manager

Diese Anleitung zeigt dir, wie du **kostenlose SSL-Zertifikate** von CloudFlare für deinen Requiem Manager einrichtest.

## 🎯 Warum CloudFlare?

| Feature | Let's Encrypt | CloudFlare Free |
|---------|---------------|-----------------|
| SSL-Zertifikat | ✅ Kostenlos | ✅ Kostenlos |
| Gültigkeit | 90 Tage | **15 Jahre** |
| Automatische Erneuerung | ❌ Komplex | ✅ Automatisch |
| CDN | ❌ Nicht enthalten | ✅ Enthalten |
| DDoS-Schutz | ❌ Nicht enthalten | ✅ Enthalten |
| Symlink-Probleme | ❌ Häufig | ✅ Keine |

## 📋 Voraussetzungen

- Domain direkt bei CloudFlare registriert oder
- Domain mit CloudFlare DNS verwaltet
- Windows Server mit öffentlicher IP-Adresse
- Requiem Manager Projekt

## 🔧 Schritt 1: CloudFlare DNS konfigurieren

### 1.1 Externe IP-Adresse ermitteln

```powershell
# Deine öffentliche IP ermitteln:
Invoke-RestMethod -Uri "https://api.ipify.org"
```

**Beispiel-Ausgabe:** `123.45.67.89`

### 1.2 DNS A-Record erstellen

1. 🌐 Gehe zu **CloudFlare Dashboard** → **DNS**
2. ➕ Klicke **"Add record"**
3. Konfiguration:

```
Type: A
Name: @ (oder requiem-guild.com)
IPv4: [DEINE_EXTERNE_IP]
Proxy status: ✅ Proxied (Orange Cloud)
TTL: Auto
```

4. Optional - WWW-Subdomain:

```
Type: A  
Name: www
IPv4: [DEINE_EXTERNE_IP]
Proxy status: ✅ Proxied (Orange Cloud)
```

## 🔐 Schritt 2: CloudFlare Origin Certificate erstellen

### 2.1 Certificate erstellen

1. 🌐 Gehe zu **CloudFlare Dashboard**
2. 📁 Wähle deine Domain
3. 🔒 Gehe zu **SSL/TLS** → **Origin Server**
4. 📄 Klicke **"Create Certificate"**

### 2.2 Certificate-Einstellungen

Konfiguriere folgende Einstellungen:

```
✅ Let CloudFlare generate a private key and a CSR
🔐 Key type: RSA (2048)  
📅 Certificate Validity: 15 years
🌐 Hostnames: 
   - requiem-guild.com
   - *.requiem-guild.com
```

5. 🚀 Klicke **"Create"**

### 2.3 Zertifikate kopieren

Nach dem Erstellen erhältst du **2 Textblöcke**:

1. **Origin Certificate** (beginnt mit `-----BEGIN CERTIFICATE-----`)
2. **Private Key** (beginnt mit `-----BEGIN PRIVATE KEY-----`)

## 📁 Schritt 3: SSL-Dateien auf dem Server erstellen

### 3.1 Verzeichnisse erstellen

```powershell
# SSL-Verzeichnis erstellen
mkdir ssl-data\live\requiem-guild.com -Force
```

### 3.2 Certificate-Datei erstellen

Erstelle: `ssl-data\live\requiem-guild.com\fullchain.pem`

```pem
-----BEGIN CERTIFICATE-----
[HIER_DEN_ORIGIN_CERTIFICATE_AUS_CLOUDFLARE_EINFÜGEN]
-----END CERTIFICATE-----
```

### 3.3 Private Key-Datei erstellen

Erstelle: `ssl-data\live\requiem-guild.com\privkey.pem`

```pem
-----BEGIN PRIVATE KEY-----
[HIER_DEN_PRIVATE_KEY_AUS_CLOUDFLARE_EINFÜGEN]
-----END PRIVATE KEY-----
```

### 3.4 Mit PowerShell erstellen

Alternativ mit unserem Script:

```powershell
# Automatische Erstellung der Template-Dateien
powershell -ExecutionPolicy Bypass -File setup-cloudflare-ssl.ps1 -Domain "requiem-guild.com"

# Dann die Dateien mit Texteditor bearbeiten:
notepad "ssl-data\live\requiem-guild.com\fullchain.pem"
notepad "ssl-data\live\requiem-guild.com\privkey.pem"
```

## ⚙️ Schritt 4: CloudFlare SSL-Modus konfigurieren

### 4.1 SSL-Modus setzen

1. 🌐 CloudFlare Dashboard → **SSL/TLS** → **Overview**
2. 🔒 Setze SSL-Modus auf: **"Full (strict)"**

### 4.2 SSL-Modi Erklärung

| Modus | Beschreibung | Empfehlung |
|-------|--------------|------------|
| Off | Kein SSL | ❌ Nicht verwenden |
| Flexible | SSL nur zwischen Browser ↔ CloudFlare | ❌ Unsicher |
| **Full (strict)** | SSL Browser ↔ CloudFlare ↔ Server | ✅ **Empfohlen** |

## 🚀 Schritt 5: Production-Environment konfigurieren

### 5.1 .env.production bearbeiten

```bash
# Domain-Konfiguration
DOMAIN=requiem-guild.com

# Discord Bot
DISCORD_TOKEN=dein_discord_bot_token
DISCORD_GUILD_ID=deine_guild_id

# Discord OAuth2
DISCORD_CLIENT_ID=deine_client_id
DISCORD_CLIENT_SECRET=dein_client_secret

# JWT Secret (generiere einen sicheren Schlüssel)
JWT_SECRET=dein_super_geheimer_jwt_schlüssel

# Admin-Konfiguration (optional)
ADMIN_ROLE_IDS=123456789,987654321
ADMIN_USER_IDS=242292116833697792
```

### 5.2 Production starten

```powershell
# Production-Environment starten
.\start-production.ps1
```

## 🔍 Schritt 6: Testen und Verifizieren

### 6.1 SSL-Zertifikat testen

```powershell
# Online SSL-Test
Start-Process "https://www.ssllabs.com/ssltest/analyze.html?d=requiem-guild.com"

# Lokaler Test
curl -I https://requiem-guild.com/health
```

### 6.2 Container-Status prüfen

```powershell
# Container-Status
docker-compose -f docker-compose.prod.yml ps

# Live-Logs anzeigen
docker-compose -f docker-compose.prod.yml logs -f

# Health-Check
Invoke-WebRequest -Uri "https://requiem-guild.com/health"
```

## 🌐 Schritt 7: Zugriff auf die Anwendung

Nach erfolgreichem Setup ist deine Anwendung erreichbar unter:

- **Frontend:** https://requiem-guild.com
- **API:** https://requiem-guild.com/api
- **API Docs:** https://requiem-guild.com/api/docs
- **Health Check:** https://requiem-guild.com/health

## 🛠️ Troubleshooting

### Problem: Certificate-Dateien sind leer

**Lösung:**
```powershell
# Dateien überprüfen
Get-Content ssl-data\live\requiem-guild.com\fullchain.pem
Get-Content ssl-data\live\requiem-guild.com\privkey.pem

# Neu erstellen falls leer
notepad ssl-data\live\requiem-guild.com\fullchain.pem
notepad ssl-data\live\requiem-guild.com\privkey.pem
```

### Problem: DNS propagiert nicht

**Lösung:**
```powershell
# DNS-Auflösung testen
nslookup requiem-guild.com
nslookup requiem-guild.com 8.8.8.8

# Online DNS-Check
Start-Process "https://dnschecker.org/#A/requiem-guild.com"
```

### Problem: Nginx startet nicht

**Lösung:**
```powershell
# Nginx-Logs prüfen
docker-compose -f docker-compose.prod.yml logs nginx

# Nginx-Konfiguration testen
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Problem: 502 Bad Gateway

**Mögliche Ursachen:**
- API-Container nicht erreichbar
- Frontend-Container nicht gestartet
- Falsche Proxy-Konfiguration

**Lösung:**
```powershell
# Alle Container neustarten
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Einzelne Services prüfen
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs frontend
```

## 📊 Management-Befehle

### Container-Verwaltung

```powershell
# Status anzeigen
docker-compose -f docker-compose.prod.yml ps

# Logs anzeigen
docker-compose -f docker-compose.prod.yml logs -f

# Neustart
docker-compose -f docker-compose.prod.yml restart

# Stoppen
docker-compose -f docker-compose.prod.yml down

# Komplett neu bauen
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### SSL-Zertifikat erneuern

CloudFlare Origin Certificates sind **15 Jahre gültig**, müssen also praktisch nie erneuert werden!

Falls doch nötig:
```powershell
# Neues Certificate erstellen (CloudFlare Dashboard)
# Neue .pem Dateien erstellen
# Container neustarten
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔒 Sicherheits-Tipps

### 1. Firewall konfigurieren

```powershell
# Nur notwendige Ports öffnen
# Port 80 (HTTP → HTTPS Redirect)
# Port 443 (HTTPS)
# Port 22 (SSH, falls benötigt)
```

### 2. Starke Passwords verwenden

- JWT_SECRET: Mindestens 64 Zeichen
- Discord Secrets: Nie im Code speichern
- .env.production: Sichere Berechtigungen

### 3. Regelmäßige Updates

```powershell
# Docker Images aktualisieren
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🎉 Fertig!

Dein Requiem Manager läuft jetzt mit:

- ✅ **Kostenloses CloudFlare SSL** (15 Jahre gültig)
- ✅ **CDN für bessere Performance**
- ✅ **DDoS-Schutz**
- ✅ **Automatische HTTPS-Weiterleitung**
- ✅ **Professional SSL A+ Rating**

**Domain:** https://requiem-guild.com

Bei Fragen oder Problemen, prüfe die Logs oder erstelle ein Issue! 🚀
