# 🔐 Manual SSL Certificate Setup

If automated Let's Encrypt setup fails, you can use these manual methods.

## Method 1: SSLForFree.com (Recommended)

### Step 1: Generate Certificate
1. Go to [SSLForFree.com](https://www.sslforfree.com/)
2. Enter your domain: `yourdomain.com`
3. Click "Create Free SSL Certificate"
4. Choose verification method: **HTTP File Upload**
5. Download the verification file
6. Upload verification file to your server

### Step 2: Domain Verification
```powershell
# Create verification directory
mkdir nginx\html\.well-known\acme-challenge

# Place verification file in the directory
# File name and content will be provided by SSLForFree
```

### Step 3: Download Certificate
1. Complete verification on SSLForFree
2. Download the certificate bundle
3. You'll get these files:
   - `certificate.crt` (your certificate)
   - `ca_bundle.crt` (intermediate certificates)
   - `private.key` (your private key)

### Step 4: Prepare for Nginx
```powershell
# Create SSL directory structure
mkdir ssl-data\conf\live\yourdomain.com

# Combine certificate and CA bundle
type certificate.crt ca_bundle.crt > ssl-data\conf\live\yourdomain.com\fullchain.pem

# Copy private key
copy private.key ssl-data\conf\live\yourdomain.com\privkey.pem
```

## Method 2: OVH SSL Certificate

If you have an OVH hosting plan, you might have access to free SSL certificates:

### Step 1: OVH Control Panel
1. Log into OVH Control Panel
2. Go to "Web Cloud" → "Hosting"
3. Select your domain
4. Go to "SSL certificates"
5. Order a free Let's Encrypt certificate

### Step 2: Download Certificate
1. Once generated, download the certificate files
2. Convert to PEM format if needed

## Method 3: Self-Signed Certificate (Development Only)

⚠️ **Only for testing - browsers will show security warnings**

```powershell
# Generate self-signed certificate using OpenSSL in Docker
docker run --rm -v "%cd%\ssl-data\conf\live\yourdomain.com:/certs" -w /certs alpine/openssl ^
  req -x509 -nodes -days 365 -newkey rsa:2048 ^
  -keyout privkey.pem -out fullchain.pem ^
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

## Method 4: CloudFlare SSL (Recommended for Production)

### Step 1: Add Domain to CloudFlare
1. Create CloudFlare account
2. Add your domain to CloudFlare
3. Update nameservers at OVH to CloudFlare's

### Step 2: Configure SSL
1. In CloudFlare dashboard: SSL/TLS → Overview
2. Set encryption mode to "Full (strict)"
3. SSL/TLS → Origin Certificates → Create Certificate
4. Download certificate and private key

### Step 3: Configure Nginx
```yaml
# Update docker-compose.prod.yml
nginx:
  volumes:
    - ./cloudflare-cert:/etc/nginx/ssl:ro
```

```nginx
# In nginx/nginx.conf
ssl_certificate /etc/nginx/ssl/cloudflare-cert.pem;
ssl_certificate_key /etc/nginx/ssl/cloudflare-key.pem;
```

## Method 5: Windows Certificate Store (IIS Integration)

If you're running IIS alongside Docker:

```powershell
# Import certificate to Windows Certificate Store
Import-PfxCertificate -FilePath "certificate.pfx" -CertStoreLocation Cert:\LocalMachine\My -Password (ConvertTo-SecureString "password" -AsPlainText -Force)

# Export as PEM for nginx
# Use certlm.msc to export certificate as Base64 X.509
```

## Testing SSL Setup

### Test Certificate Validity
```powershell
# Test with OpenSSL
docker run --rm -it alpine/openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test with curl
curl -I https://yourdomain.com

# Online tools
# - https://www.ssllabs.com/ssltest/
# - https://www.digicert.com/help/
```

### Common Issues

#### Certificate Chain Issues
```bash
# Verify certificate chain
openssl verify -CAfile ca_bundle.crt certificate.crt
```

#### File Permissions
```powershell
# Ensure correct permissions (if using Linux containers)
icacls ssl-data /grant Everyone:F /T
```

#### Mixed Content Warnings
- Ensure all resources (images, CSS, JS) use HTTPS URLs
- Update `REACT_APP_API_URL` to use HTTPS
- Check for hardcoded HTTP links

## Troubleshooting

### Certificate Not Found
```
[ERROR] nginx: [emerg] cannot load certificate "/etc/nginx/ssl/fullchain.pem"
```

**Solution:**
1. Check file exists in `ssl-data\conf\live\yourdomain.com\`
2. Verify Docker volume mount is correct
3. Check file permissions

### Certificate Expired
```
[ERROR] SSL certificate verify result: certificate has expired
```

**Solution:**
1. Renew certificate using your chosen method
2. Restart nginx container: `docker-compose restart nginx`

### Browser Security Warnings
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Solution:**
1. Ensure you're using a valid CA certificate
2. Check certificate chain is complete
3. Verify domain name matches certificate

## Automation Scripts

### Renewal Script for Manual Certificates
```powershell
# create-renewal-reminder.ps1
$scriptBlock = {
    $cert = Get-ChildItem -Path "ssl-data\conf\live\yourdomain.com\fullchain.pem"
    $expiryDate = (openssl x509 -enddate -noout -in $cert.FullName).Split('=')[1]
    $daysUntilExpiry = ((Get-Date $expiryDate) - (Get-Date)).Days
    
    if ($daysUntilExpiry -lt 30) {
        Write-Host "SSL Certificate expires in $daysUntilExpiry days!"
        # Add notification logic here (email, Teams, etc.)
    }
}

# Create scheduled task
Register-ScheduledTask -TaskName "SSL Certificate Check" -Action (New-ScheduledTaskAction -Execute "PowerShell" -Argument "-WindowStyle Hidden -Command `"$scriptBlock`"") -Trigger (New-ScheduledTaskTrigger -Daily -At "09:00")
```

---

Choose the method that works best for your setup. For production, CloudFlare SSL is often the easiest and most reliable option.
