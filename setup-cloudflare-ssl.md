# CloudFlare SSL Setup (Recommended)

## Why CloudFlare SSL?
- ✅ No symlink issues
- ✅ Automatic renewal
- ✅ Better performance (CDN)
- ✅ DDoS protection
- ✅ Works immediately

## Step 1: Add Domain to CloudFlare
1. Go to https://www.cloudflare.com/
2. Create account (free)
3. Add domain: `niklasky.com`
4. CloudFlare will scan your DNS

## Step 2: Update Nameservers at OVH
1. Log into OVH Control Panel
2. Go to Domain Management
3. Change nameservers to CloudFlare's:
   ```
   ava.ns.cloudflare.com
   reza.ns.cloudflare.com
   ```

## Step 3: Configure DNS in CloudFlare
1. Add A record: `requiem` → `93.254.170.97` (your server IP)
2. Make sure it's "Proxied" (orange cloud)

## Step 4: Generate Origin Certificate
1. In CloudFlare: SSL/TLS → Origin Certificates
2. Click "Create Certificate"
3. Select:
   - Let CloudFlare generate private key
   - Hostname: `requiem.niklasky.com`
   - Certificate validity: 15 years
4. Download both files:
   - Certificate (save as `fullchain.pem`)
   - Private Key (save as `privkey.pem`)

## Step 5: Install Certificate
```powershell
# Create directory
mkdir ssl-data\conf\live\requiem.niklasky.com -Force

# Save CloudFlare certificate as fullchain.pem
# Save CloudFlare private key as privkey.pem
```

## Step 6: Update .env.production
```env
DOMAIN=requiem.niklasky.com
```

## Step 7: Start Production
```powershell
.\start-production-clean.ps1
```

## Benefits of CloudFlare SSL
- 🚀 **Instant SSL** - No waiting for Let's Encrypt
- 🛡️ **DDoS Protection** - Automatic
- ⚡ **CDN** - Faster loading
- 🔄 **Auto-Renewal** - 15 year validity
- 🔒 **Full SSL** - End-to-end encryption
- 📊 **Analytics** - Traffic insights

## No More Issues With:
- ❌ Symlink problems
- ❌ Let's Encrypt failures
- ❌ Port 80 requirements
- ❌ Certificate renewals
- ❌ DNS challenges
