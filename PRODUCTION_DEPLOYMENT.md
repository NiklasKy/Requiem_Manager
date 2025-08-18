# 🚀 Production Deployment Guide

Complete guide for deploying Requiem Manager to a Windows Server with SSL and custom domain.

## 🏗️ Architecture Overview

```
Internet → OVH Domain → Windows Server → Nginx (SSL) → Docker Containers
                                     ↓
                           [Bot] [API] [Frontend]
```

## 🚀 Quick Start (TL;DR)

### ⚡ 5-Minute Production Setup
```powershell
# Prerequisites: Windows Server + Docker + Git + Domain pointing to server

# 1. Clone repository
git clone https://github.com/yourusername/Requiem_Manager.git
cd Requiem_Manager

# 2. Configure environment
copy .env.example .env.production
notepad .env.production  # Edit with your values

# 3. Automated SSL setup
.\setup-ssl.bat yourdomain.com

# 4. Start production
.\start-production.bat

# 5. Access: https://yourdomain.com
```

## 📋 Prerequisites

### Windows Server Requirements
- **Windows Server 2019/2022** or Windows 10/11 Pro
- **Docker Desktop** for Windows
- **Git** for Windows
- **PowerShell** 5.1+ or PowerShell Core 7+
- **Minimum 4GB RAM, 20GB Storage**

### Domain & DNS Setup (OVH)
- **Domain name** pointing to your server
- **A Record** pointing to your server's public IP
- **SSL Certificate** (automated via scripts)

## 🎯 Step 1: Server Preparation

### 1.1 Install Required Software
```powershell
# Install Chocolatey (Package Manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Git
choco install git -y

# Install Docker Desktop
choco install docker-desktop -y

# Restart required after Docker installation
```

### 1.2 Configure Windows Firewall
```powershell
# Allow HTTP/HTTPS traffic
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS Inbound" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Optional: Allow SSH for remote management
New-NetFirewallRule -DisplayName "SSH Inbound" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow
```

## 🌐 Step 2: DNS Configuration (OVH)

### 2.1 Configure DNS Records
In your OVH DNS management:

```dns
# Main domain
yourdomain.com.     A     300     YOUR_SERVER_IP

# Optional: www subdomain
www.yourdomain.com. CNAME 300     yourdomain.com.

# Optional: API subdomain
api.yourdomain.com. CNAME 300     yourdomain.com.
```

### 2.2 Verify DNS Propagation
```powershell
# Test DNS resolution
nslookup yourdomain.com
ping yourdomain.com
```

## 📁 Step 3: Deploy Application

### 3.1 Clone Repository
```powershell
# Navigate to desired directory
cd C:\
mkdir Production
cd Production

# Clone repository
git clone https://github.com/yourusername/Requiem_Manager.git
cd Requiem_Manager
```

### 3.2 Configure Environment Variables
```powershell
# Copy production environment template
copy .env.example .env.production
```

Edit `.env.production`:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_production_bot_token
DISCORD_GUILD_ID=your_production_guild_id

# Discord OAuth2 Configuration (IMPORTANT: Use HTTPS!)
DISCORD_CLIENT_ID=your_production_client_id
DISCORD_CLIENT_SECRET=your_production_client_secret
DISCORD_REDIRECT_URI=https://yourdomain.com/auth/callback

# JWT Configuration (GENERATE NEW SECRET!)
JWT_SECRET=generate-a-new-64-character-secret-here

# Admin Configuration (Production Admin IDs)
ADMIN_ROLE_IDS=production_role_id_1,production_role_id_2
ADMIN_USER_IDS=your_user_id

# Database Configuration
DATABASE_PATH=./data/tracking.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Domain Configuration
DOMAIN=yourdomain.com
```

Create `frontend/.env.production`:
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_DEFAULT_GUILD_ID=your_production_guild_id
REACT_APP_DISCORD_CLIENT_ID=your_production_client_id
```

## 🔒 Step 4: SSL Certificate Setup (Recommended Methods)

### 🎯 Method 1: Automated Docker SSL Setup (Easiest)
```powershell
# Run the automated SSL setup script
.\setup-ssl.bat yourdomain.com
```

This script automatically:
- ✅ Tries multiple Let's Encrypt methods
- ✅ Handles port conflicts intelligently  
- ✅ Creates proper directory structure
- ✅ Sets up auto-renewal
- ✅ Provides fallback options

### 🌐 Method 2: CloudFlare SSL (Best for Production)
**Recommended for enterprise setups with high traffic:**

1. **Add domain to CloudFlare:**
   - Create account at [CloudFlare.com](https://www.cloudflare.com/)
   - Add your domain
   - Update nameservers at OVH to CloudFlare's

2. **Generate Origin Certificate:**
   ```
   CloudFlare Dashboard → SSL/TLS → Origin Certificates → Create Certificate
   ```

3. **Download and place certificates:**
   ```powershell
   # Create SSL directory
   mkdir ssl-data\conf\live\yourdomain.com
   
   # Place CloudFlare certificates:
   # - cloudflare-cert.pem → fullchain.pem
   # - cloudflare-key.pem → privkey.pem
   ```

### 🆓 Method 3: SSLForFree (Manual but Reliable)
**If automated methods fail:**

1. **Go to [SSLForFree.com](https://www.sslforfree.com/)**
2. **Enter domain:** `yourdomain.com`
3. **Choose HTTP verification**
4. **Download verification file to:** `nginx\html\.well-known\acme-challenge\`
5. **Complete verification and download certificates**
6. **Place in:** `ssl-data\conf\live\yourdomain.com\`

### 4.1 SSL Directory Structure
After setup, you should have:
```
ssl-data/
  conf/
    live/
      yourdomain.com/
        ├── fullchain.pem  (Certificate + CA bundle)
        └── privkey.pem    (Private key)
```

### 4.2 Automatic Renewal Setup
```powershell
# The setup-ssl.bat script creates this automatically
# Manual setup for other methods:

$renewScript = @"
cd C:\Production\Requiem_Manager
docker run --rm -v `"%cd%\ssl-data\conf:/etc/letsencrypt`" certbot/certbot renew --quiet
if (`$LASTEXITCODE -eq 0) {
    docker-compose -f docker-compose.prod.yml restart nginx
}
"@

$renewScript | Out-File -FilePath "renew-ssl.ps1" -Encoding UTF8

# Schedule weekly renewal
schtasks /create /tn "SSL Renewal" /tr "powershell.exe -File C:\Production\Requiem_Manager\renew-ssl.ps1" /sc weekly /st 02:00 /ru SYSTEM
```

## 🐳 Step 5: Production Docker Configuration

### 5.1 Production Files Created
The following production files have been created:
- `docker-compose.prod.yml` - Production container configuration
- `nginx/nginx.conf` - Nginx reverse proxy with SSL
- `nginx/security.conf` - Security headers configuration
- `Dockerfile.api` - Production API container
- `Dockerfile.bot` - Production bot container
- `frontend/Dockerfile.prod` - Production frontend container
- `start-production.bat` - Production startup script
- `stop-production.bat` - Production stop script

### 5.2 Generate Strong JWT Secret
```powershell
# Generate a secure JWT secret
$bytes = [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
$secret = [Convert]::ToBase64String($bytes)
Write-Host "Generated JWT Secret: $secret"
```

### 5.3 Start Production Environment
```powershell
# Make sure you're in the project directory
cd C:\Production\Requiem_Manager

# Verify configuration
type .env.production | findstr DOMAIN
type .env.production | findstr DISCORD_TOKEN

# Start production environment
.\start-production.bat
```

**The startup script will:**
- ✅ Validate all required environment variables
- ✅ Check SSL certificate existence
- ✅ Pull latest Docker images
- ✅ Build and start all containers
- ✅ Display access URLs and status

## 🔧 Step 6: Discord OAuth2 Production Setup

### 6.1 Update Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** → **General**
4. Add production redirect URI:
   ```
   https://yourdomain.com/auth/callback
   ```
5. Save changes

### 6.2 Test OAuth2 Flow
1. Visit `https://yourdomain.com`
2. Click "Sign in with Discord"
3. Authorize the application
4. Verify successful login and admin rights

## 🚀 Step 7: Go Live!

### 7.1 Final Checklist
- ✅ DNS pointing to your server
- ✅ SSL certificate installed and valid
- ✅ Discord OAuth2 configured for production domain
- ✅ Environment variables set correctly
- ✅ All containers running and healthy
- ✅ Admin rights working correctly

### 7.2 Monitor Deployment
```powershell
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f bot
```

## 🔒 Step 8: Security Hardening

### 8.1 Windows Server Security
```powershell
# Enable Windows Defender
Set-MpPreference -DisableRealtimeMonitoring $false

# Update Windows
Install-WindowsUpdate -AcceptAll -AutoReboot

# Configure automatic updates
$AUSettings = New-Object -ComObject "Microsoft.Update.AutoUpdate"
$AUSettings.Settings.NotificationLevel = 4
```

### 8.2 Docker Security
```powershell
# Enable Docker BuildKit for better security
$env:DOCKER_BUILDKIT = 1

# Regular security updates
docker system prune -f
docker image prune -a -f
```

### 8.3 Nginx Security
The provided `nginx/security.conf` includes:
- XSS Protection
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- Content Type Options
- Frame Options
- Rate limiting for API and auth endpoints

## 📊 Step 9: Monitoring & Maintenance

### 9.1 Log Management
```powershell
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Archive logs (run weekly)
$date = Get-Date -Format "yyyy-MM-dd"
docker-compose -f docker-compose.prod.yml logs > "logs\archive\system-$date.log"
```

### 9.2 Database Backup
```powershell
# Create backup script
$backupScript = @"
`$date = Get-Date -Format "yyyy-MM-dd-HHmm"
Copy-Item "data\tracking.db" "backups\tracking-`$date.db"

# Keep only last 30 backups
Get-ChildItem "backups\*.db" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item
"@

$backupScript | Out-File -FilePath "backup-database.ps1" -Encoding UTF8

# Create scheduled task for daily backups
schtasks /create /tn "Database Backup" /tr "powershell.exe -File C:\Production\Requiem_Manager\backup-database.ps1" /sc daily /st 03:00 /ru SYSTEM
```

### 9.3 Health Monitoring
```powershell
# Create health check script
$healthScript = @"
# Check if all containers are running
`$containers = docker-compose -f docker-compose.prod.yml ps -q
`$unhealthy = docker inspect `$containers --format='{{.State.Health.Status}}' | Where-Object { `$_ -ne 'healthy' }

if (`$unhealthy) {
    Write-Host "Unhealthy containers detected. Restarting..."
    docker-compose -f docker-compose.prod.yml restart
    
    # Send notification (configure with your preferred method)
    # Send-MailMessage -To "admin@yourdomain.com" -Subject "Requiem Manager - Health Check Alert"
}
"@

$healthScript | Out-File -FilePath "health-check.ps1" -Encoding UTF8

# Run health check every 5 minutes
schtasks /create /tn "Health Check" /tr "powershell.exe -File C:\Production\Requiem_Manager\health-check.ps1" /sc minute /mo 5 /ru SYSTEM
```

## 🛠️ Quick Troubleshooting

### ⚡ Most Common Issues & Instant Fixes

#### 🚨 "Docker is not running"
```powershell
# Start Docker Desktop
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
# Wait 30 seconds, then retry
```

#### 🚨 "SSL Certificate not found"
```powershell
# Re-run SSL setup
.\setup-ssl.bat yourdomain.com

# Or use manual method
# See SIMPLE_SSL_SETUP.md for alternatives
```

#### 🚨 "DNS not pointing to server"
```powershell
# Test DNS resolution
nslookup yourdomain.com
ping yourdomain.com

# Should return your server's IP address
# If not, update A record in OVH DNS panel
```

#### 🚨 "Port 80/443 already in use"
```powershell
# Find what's using the ports
netstat -ano | findstr ":80 "
netstat -ano | findstr ":443 "

# Stop IIS if running
iisreset /stop

# Or stop conflicting services
Get-Service | Where-Object {$_.Status -eq "Running" -and $_.Name -like "*web*"}
```

#### 🚨 "Container startup failed"
```powershell
# Check container logs
docker-compose -f docker-compose.prod.yml logs

# Restart specific container
docker-compose -f docker-compose.prod.yml restart nginx
docker-compose -f docker-compose.prod.yml restart api
docker-compose -f docker-compose.prod.yml restart bot
```

#### 🚨 "Discord OAuth2 errors"
```powershell
# Verify redirect URI matches exactly
# Discord Dev Portal → OAuth2 → Redirects
# Must be: https://yourdomain.com/auth/callback

# Test environment variables
type .env.production | findstr DISCORD_CLIENT_ID
type .env.production | findstr DISCORD_REDIRECT_URI
```

### 🔧 Advanced Troubleshooting

#### SSL Certificate Issues
```powershell
# Check certificate validity
certbot certificates

# Renew certificate manually
certbot renew --force-renewal

# Restart nginx after renewal
docker-compose -f docker-compose.prod.yml restart nginx
```

#### Container Startup Issues
```powershell
# Check container logs
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs bot
docker-compose -f docker-compose.prod.yml logs frontend

# Rebuild containers
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

#### Database Connection Issues
```powershell
# Check database file permissions
icacls data\tracking.db

# Fix permissions if needed
icacls data\tracking.db /grant Everyone:F
```

#### Discord OAuth2 Issues
1. Verify redirect URI matches exactly
2. Check client ID and secret in environment
3. Ensure Discord application is not restricted
4. Test with incognito browser window

### Performance Optimization

#### Docker Resource Limits
Add to `docker-compose.prod.yml`:
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

#### Nginx Caching
Add to nginx configuration:
```nginx
# Enable caching
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache app_cache;
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
}
```

## 📞 Production Support

### Emergency Procedures
1. **Service Down**: Run `.\start-production.bat`
2. **Database Corruption**: Restore from backup in `backups/`
3. **SSL Issues**: Run `certbot renew` and restart nginx
4. **High Load**: Scale containers with `docker-compose scale`

### Maintenance Windows
Schedule regular maintenance:
- **Weekly**: Check logs and health status
- **Monthly**: Update Docker images and system packages
- **Quarterly**: Review and rotate secrets
- **Annually**: Review and update SSL certificates

---

## 🏆 Production Best Practices

### 🔒 Security Recommendations
```powershell
# 1. Change default admin user IDs in production
ADMIN_USER_IDS=your_actual_discord_user_id

# 2. Use strong JWT secret (never reuse development secret)
JWT_SECRET=generate-new-64-character-hex-string

# 3. Regular security updates
# Schedule monthly Windows Updates
schtasks /create /tn "Windows Updates" /tr "powershell.exe Install-WindowsUpdate -AcceptAll" /sc monthly

# 4. Enable Windows Firewall with minimal ports
netsh advfirewall firewall set rule group="Remote Desktop" new enable=Yes
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=No
```

### 📊 Monitoring Setup
```powershell
# 1. Set up log rotation (weekly)
$logRotate = @"
Get-ChildItem "logs\*.log" | Where-Object LastWriteTime -lt (Get-Date).AddDays(-7) | Remove-Item
docker system prune -f
"@
$logRotate | Out-File -FilePath "weekly-cleanup.ps1"

# 2. Database backup verification
$backupCheck = @"
`$latestBackup = Get-ChildItem "backups\*.db" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ((Get-Date) - `$latestBackup.LastWriteTime -gt [TimeSpan]::FromDays(2)) {
    Write-Host "WARNING: Database backup is older than 2 days!"
}
"@
$backupCheck | Out-File -FilePath "backup-check.ps1"
```

### 🚀 Performance Optimization
```powershell
# 1. Docker resource optimization
# Add to docker-compose.prod.yml for each service:
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M

# 2. Enable Docker BuildKit for faster builds
[Environment]::SetEnvironmentVariable("DOCKER_BUILDKIT", "1", "Machine")

# 3. Regular Docker cleanup
docker system prune -a -f --volumes
```

### 🔄 Update Strategy
```powershell
# 1. Safe production update process
git fetch origin
git checkout main
git pull origin main

# 2. Test in staging first (if available)
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify all services are healthy
docker-compose -f docker-compose.prod.yml ps
```

### 📱 Notification Setup (Optional)
```powershell
# Set up email notifications for critical events
# Configure SMTP settings and add to health check scripts
$emailConfig = @"
`$smtpServer = "smtp.gmail.com"
`$smtpPort = 587
`$emailFrom = "alerts@yourdomain.com"
`$emailTo = "admin@yourdomain.com"
# Add email sending logic to health-check.ps1
"@
```

---

**🎉 Congratulations! Your Requiem Manager is now running in production with enterprise-grade security and monitoring!** 🚀

## 📞 Production Support Checklist

### ✅ Pre-Go-Live Checklist
- [ ] DNS A record pointing to server
- [ ] SSL certificate valid and auto-renewing
- [ ] All environment variables configured
- [ ] Discord OAuth2 redirect URI updated
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Admin user IDs set correctly
- [ ] Database backups automated
- [ ] Monitoring scripts scheduled
- [ ] Load testing completed
- [ ] Emergency procedures documented

### 🆘 Emergency Contacts & Procedures
1. **Service Down**: `.\start-production.bat`
2. **Database Issues**: Restore from `backups\` directory
3. **SSL Problems**: Re-run `.\setup-ssl.bat yourdomain.com`
4. **High Load**: Monitor with `docker stats`
5. **Security Incident**: Check logs in `logs\` directory

### 📈 Success Metrics
- **Uptime Target**: 99.9%
- **Response Time**: < 2 seconds
- **SSL Rating**: A+ on SSL Labs
- **Security Headers**: Pass all checks
- **Backup Frequency**: Daily automated
- **Update Frequency**: Monthly security patches
