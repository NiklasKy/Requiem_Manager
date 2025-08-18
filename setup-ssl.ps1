# SSL Certificate Setup with Docker - PowerShell Version
param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$Domain
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SSL Certificate Setup with Docker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker version | Out-Null
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Get domain name
if ([string]::IsNullOrEmpty($Domain)) {
    $Domain = Read-Host "Enter your domain name (e.g., yourdomain.com)"
}

if ([string]::IsNullOrEmpty($Domain)) {
    Write-Host "[ERROR] Domain name is required." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Setting up SSL certificate for: $Domain" -ForegroundColor Yellow
Write-Host ""

# Create directories
$sslDirs = @("ssl-data", "ssl-data\conf", "ssl-data\www")
foreach ($dir in $sslDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "[INFO] Created directory: $dir" -ForegroundColor Green
    }
}

# Stop any running nginx to free port 80
Write-Host "[INFO] Stopping nginx container if running..." -ForegroundColor Yellow
try {
    docker stop requiem-nginx 2>$null
} catch {
    # Container might not exist, that's okay
}

# Method 1: Try standalone first (if port 80 is free)
Write-Host "[INFO] Attempting standalone certificate generation..." -ForegroundColor Yellow

$standaloneArgs = @(
    "run", "--rm",
    "-p", "80:80",
    "-v", "$PWD\ssl-data\conf:/etc/letsencrypt",
    "-v", "$PWD\ssl-data\www:/var/www/certbot",
    "certbot/certbot",
    "certonly", "--standalone", 
    "--email", "admin@$Domain", 
    "--agree-tos", "--no-eff-email",
    "-d", $Domain, "-d", "www.$Domain"
)

$standaloneResult = & docker $standaloneArgs
$standaloneSuccess = $LASTEXITCODE -eq 0

if (-not $standaloneSuccess) {
    Write-Host "[WARNING] Standalone method failed. Trying webroot method..." -ForegroundColor Yellow
    Write-Host ""
    
    # Method 2: Webroot method with temporary nginx
    Write-Host "[INFO] Starting temporary nginx for webroot validation..." -ForegroundColor Yellow
    
    # Create temporary nginx config
    $nginxConfig = @"
server {
    listen 80;
    server_name $Domain www.$Domain;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'SSL Setup in Progress';
        add_header Content-Type text/plain;
    }
}
"@
    
    $nginxConfig | Out-File -FilePath "temp-nginx.conf" -Encoding UTF8
    
    # Start temporary nginx
    $tempNginxArgs = @(
        "run", "-d", "--name", "temp-nginx",
        "-p", "80:80",
        "-v", "$PWD\temp-nginx.conf:/etc/nginx/conf.d/default.conf:ro",
        "-v", "$PWD\ssl-data\www:/var/www/certbot",
        "nginx:alpine"
    )
    
    try {
        & docker $tempNginxArgs
        Write-Host "[INFO] Temporary nginx started" -ForegroundColor Green
        
        # Wait for nginx to start
        Start-Sleep -Seconds 5
        
        # Generate certificate using webroot
        $webrootArgs = @(
            "run", "--rm",
            "-v", "$PWD\ssl-data\conf:/etc/letsencrypt",
            "-v", "$PWD\ssl-data\www:/var/www/certbot",
            "certbot/certbot",
            "certonly", "--webroot", "--webroot-path=/var/www/certbot",
            "--email", "admin@$Domain", 
            "--agree-tos", "--no-eff-email",
            "-d", $Domain, "-d", "www.$Domain"
        )
        
        & docker $webrootArgs
        $webrootSuccess = $LASTEXITCODE -eq 0
        
    } finally {
        # Clean up temporary nginx
        try {
            docker stop temp-nginx 2>$null
            docker rm temp-nginx 2>$null
            Remove-Item "temp-nginx.conf" -ErrorAction SilentlyContinue
            Write-Host "[INFO] Cleaned up temporary nginx" -ForegroundColor Green
        } catch {
            Write-Host "[WARNING] Could not clean up temporary nginx" -ForegroundColor Yellow
        }
    }
} else {
    $webrootSuccess = $true  # Standalone worked
}

# Check if certificate was created
$certPath = "ssl-data\conf\live\$Domain\fullchain.pem"
if (Test-Path $certPath) {
    Write-Host ""
    Write-Host "[SUCCESS] SSL certificate generated successfully!" -ForegroundColor Green
    Write-Host "Certificate location: ssl-data\conf\live\$Domain\" -ForegroundColor Green
    Write-Host ""
    
    # Create renewal script
    $renewalScript = @"
@echo off
echo [INFO] Renewing SSL certificate...
docker run --rm -v "%cd%\ssl-data\conf:/etc/letsencrypt" -v "%cd%\ssl-data\www:/var/www/certbot" certbot/certbot renew --quiet
if %errorlevel% equ 0 (
    echo [SUCCESS] Certificate renewed
    docker-compose -f docker-compose.prod.yml restart nginx 2>nul
) else (
    echo [ERROR] Certificate renewal failed
)
"@
    
    $renewalScript | Out-File -FilePath "renew-ssl.bat" -Encoding UTF8
    
    # Also create PowerShell version
    $renewalScriptPS = @"
# SSL Certificate Renewal Script
Write-Host "[INFO] Renewing SSL certificate..." -ForegroundColor Yellow

try {
    `$result = docker run --rm -v "`$PWD\ssl-data\conf:/etc/letsencrypt" -v "`$PWD\ssl-data\www:/var/www/certbot" certbot/certbot renew --quiet
    
    if (`$LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Certificate renewed" -ForegroundColor Green
        
        # Restart nginx if running
        try {
            docker-compose -f docker-compose.prod.yml restart nginx
            Write-Host "[INFO] Nginx restarted" -ForegroundColor Green
        } catch {
            Write-Host "[WARNING] Could not restart nginx" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] Certificate renewal failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to run renewal: `$_" -ForegroundColor Red
    exit 1
}
"@
    
    $renewalScriptPS | Out-File -FilePath "renew-ssl.ps1" -Encoding UTF8
    
    Write-Host "[INFO] Created automatic renewal scripts:" -ForegroundColor Green
    Write-Host "  - renew-ssl.bat (Batch version)" -ForegroundColor White
    Write-Host "  - renew-ssl.ps1 (PowerShell version)" -ForegroundColor White
    Write-Host ""
    
    # Create scheduled task setup script
    $taskScript = @"
# Schedule SSL Renewal Task
`$taskName = "SSL Certificate Renewal - Requiem"
`$scriptPath = "`$PWD\renew-ssl.ps1"
`$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2:00AM
`$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"`$scriptPath`""
`$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName `$taskName -Trigger `$trigger -Action `$action -Settings `$settings -Description "Automatic SSL certificate renewal for Requiem Manager" -Force
    Write-Host "[SUCCESS] Scheduled task created: `$taskName" -ForegroundColor Green
    Write-Host "Task will run weekly on Sundays at 2:00 AM" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create scheduled task: `$_" -ForegroundColor Red
    Write-Host "You can create it manually in Task Scheduler" -ForegroundColor Yellow
}
"@
    
    $taskScript | Out-File -FilePath "schedule-ssl-renewal.ps1" -Encoding UTF8
    
    Write-Host "[INFO] Created task scheduler setup: schedule-ssl-renewal.ps1" -ForegroundColor Green
    Write-Host ""
    
    # Show next steps
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "           NEXT STEPS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Update your .env.production file with:" -ForegroundColor Yellow
    Write-Host "   DOMAIN=$Domain" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Schedule automatic renewal (run as Administrator):" -ForegroundColor Yellow
    Write-Host "   .\schedule-ssl-renewal.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Start production environment:" -ForegroundColor Yellow
    Write-Host "   .\start-production.bat" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Access your application:" -ForegroundColor Yellow
    Write-Host "   https://$Domain" -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "[ERROR] Certificate generation failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "[MANUAL METHOD] Try this instead:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://www.sslforfree.com/" -ForegroundColor White
    Write-Host "2. Enter domain: $Domain" -ForegroundColor White
    Write-Host "3. Download certificate files" -ForegroundColor White
    Write-Host "4. Place them in: ssl-data\conf\live\$Domain\" -ForegroundColor White
    Write-Host "   - fullchain.pem" -ForegroundColor White
    Write-Host "   - privkey.pem" -ForegroundColor White
    Write-Host ""
    
    # Show troubleshooting
    Write-Host "[TROUBLESHOOTING]" -ForegroundColor Yellow
    Write-Host "Check if your domain points to this server:" -ForegroundColor White
    try {
        $dnsResult = Resolve-DnsName -Name $Domain -Type A -ErrorAction SilentlyContinue
        if ($dnsResult) {
            Write-Host "Domain resolves to: $($dnsResult.IPAddress -join ', ')" -ForegroundColor White
        } else {
            Write-Host "Could not resolve domain DNS" -ForegroundColor Red
        }
    } catch {
        Write-Host "DNS check failed" -ForegroundColor Red
    }
    
    try {
        $publicIP = (Invoke-WebRequest -Uri "https://ipecho.net/plain" -UseBasicParsing).Content.Trim()
        Write-Host "Your server's public IP: $publicIP" -ForegroundColor White
    } catch {
        Write-Host "Could not determine public IP" -ForegroundColor Yellow
    }
    Write-Host ""
}

Read-Host "Press Enter to continue"
