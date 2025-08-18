# 🚀 Simple SSL Setup Guide

Quick and easy SSL setup for your Windows Server.

## 🎯 Recommended: Docker Certbot Method

This is the **easiest** method that works on any Windows Server:

### Step 1: Run SSL Setup Script
```powershell
# Make sure Docker is running
# Navigate to your project directory
cd C:\Production\Requiem_Manager

# Run the SSL setup script
.\setup-ssl.bat yourdomain.com
```

The script will automatically:
- ✅ Stop any running containers
- ✅ Try multiple SSL generation methods
- ✅ Create renewal scripts
- ✅ Set up proper directory structure

### Step 2: Start Production
```powershell
# Edit your .env.production file
# Add: DOMAIN=yourdomain.com

# Start production environment
.\start-production.bat
```

## 🛠️ Alternative: Manual SSL Methods

If the automated script doesn't work, try these:

### Option A: SSLForFree (Free, Easy)
1. **Go to:** [SSLForFree.com](https://www.sslforfree.com/)
2. **Enter domain:** `yourdomain.com`
3. **Verify domain** via HTTP file upload
4. **Download certificates**
5. **Place in:** `ssl-data\conf\live\yourdomain.com\`

### Option B: CloudFlare SSL (Best for Production)
1. **Add domain to CloudFlare**
2. **Update nameservers** at OVH
3. **Generate Origin Certificate** in CloudFlare
4. **Download and place** in SSL directory

### Option C: OVH SSL (If Available)
1. **Check OVH Control Panel**
2. **Order free Let's Encrypt** certificate
3. **Download and convert** to PEM format

## 📁 SSL File Structure

After SSL setup, you should have:
```
ssl-data/
  conf/
    live/
      yourdomain.com/
        ├── fullchain.pem  (Certificate + Intermediate)
        └── privkey.pem    (Private Key)
```

## ✅ Testing SSL

### Quick Test
```powershell
# Test if certificate is working
curl -I https://yourdomain.com
```

### Online Testing
- **SSL Labs:** https://www.ssllabs.com/ssltest/
- **SSL Checker:** https://www.digicert.com/help/

## 🔄 SSL Renewal

### Automatic Renewal (Let's Encrypt)
```powershell
# The setup script creates renew-ssl.bat
# Schedule this in Windows Task Scheduler:

schtasks /create /tn "SSL Renewal" /tr "C:\Production\Requiem_Manager\renew-ssl.bat" /sc weekly /st 02:00
```

### Manual Renewal
- **SSLForFree:** Regenerate every 90 days
- **CloudFlare:** Auto-renews, just re-download if needed
- **OVH:** Check OVH panel for renewal

## 🚨 Common Issues & Solutions

### Issue: "Port 80 already in use"
```powershell
# Find what's using port 80
netstat -ano | findstr :80

# Stop IIS if running
iisreset /stop

# Run SSL setup again
.\setup-ssl.bat yourdomain.com
```

### Issue: "Certificate not found"
```powershell
# Check if files exist
dir ssl-data\conf\live\yourdomain.com\

# If empty, try manual method or check domain DNS
```

### Issue: "DNS not pointing to server"
```powershell
# Test DNS resolution
nslookup yourdomain.com

# Should return your server's IP address
```

### Issue: "Domain verification failed"
- ✅ Ensure DNS A record points to your server
- ✅ Wait 24-48 hours for DNS propagation
- ✅ Check firewall allows port 80/443

## 🎯 Quick Start Checklist

- [ ] Docker Desktop running
- [ ] Domain DNS pointing to server (A record)
- [ ] Firewall allows ports 80/443
- [ ] Run `.\setup-ssl.bat yourdomain.com`
- [ ] Edit `.env.production` with `DOMAIN=yourdomain.com`
- [ ] Run `.\start-production.bat`
- [ ] Test: `https://yourdomain.com`

## 📞 Need Help?

If SSL setup fails:

1. **Check logs:** Look at the error messages in console
2. **Try manual method:** Use SSLForFree.com
3. **CloudFlare route:** Often the most reliable
4. **Test basic setup:** Make sure DNS and firewall are correct

---

**🎉 Once SSL is working, your Requiem Manager will be accessible via HTTPS with enterprise-grade security!** 🔒✨
