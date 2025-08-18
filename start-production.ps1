# Requiem Manager - Production Start Script
param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipSSLCheck,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoLogs
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Requiem Manager - Production Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to load .env file
function Get-EnvVariables {
    param([string]$FilePath)
    
    $envVars = @{}
    if (Test-Path $FilePath) {
        Get-Content $FilePath | ForEach-Object {
            if ($_ -match '^([^#][^=]*?)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                # Remove quotes if present
                $value = $value -replace '^"(.*)"$', '$1'
                $value = $value -replace "^'(.*)'$", '$1'
                $envVars[$key] = $value
                # Set environment variable for current session
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    return $envVars
}

# Function to validate required environment variables
function Test-RequiredEnvVars {
    param([hashtable]$EnvVars, [array]$RequiredVars)
    
    $missing = @()
    foreach ($var in $RequiredVars) {
        if (-not $EnvVars.ContainsKey($var) -or [string]::IsNullOrEmpty($EnvVars[$var])) {
            $missing += $var
        }
    }
    return $missing
}

# Function to check container health
function Test-ContainerHealth {
    param([string]$ComposeFile)
    
    try {
        $containers = docker-compose -f $ComposeFile ps -q
        $healthyCount = 0
        $totalCount = 0
        
        foreach ($container in $containers) {
            if ($container) {
                $totalCount++
                $health = docker inspect $container --format='{{.State.Health.Status}}' 2>$null
                if ($health -eq "healthy" -or $health -eq "") {
                    $healthyCount++
                }
            }
        }
        
        return @{
            Total = $totalCount
            Healthy = $healthyCount
            Percentage = if ($totalCount -gt 0) { [math]::Round(($healthyCount / $totalCount) * 100, 1) } else { 0 }
        }
    } catch {
        return @{ Total = 0; Healthy = 0; Percentage = 0 }
    }
}

# Check if Docker is running
Write-Host "[INFO] Checking Docker availability..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "[SUCCESS] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host ""
    Write-Host "To start Docker Desktop automatically:" -ForegroundColor Yellow
    Write-Host 'Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"' -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if .env.production exists
$envFile = ".env.production"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env.production file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create the production environment file:" -ForegroundColor Yellow
    Write-Host "1. Copy .env.example to .env.production" -ForegroundColor White
    Write-Host "2. Edit .env.production with your production values" -ForegroundColor White
    Write-Host ""
    
    if (Test-Path ".env.example") {
        $createEnv = Read-Host "Would you like me to copy .env.example to .env.production now? (y/N)"
        if ($createEnv -eq 'y' -or $createEnv -eq 'Y') {
            Copy-Item ".env.example" ".env.production"
            Write-Host "[SUCCESS] Created .env.production from template" -ForegroundColor Green
            Write-Host "Please edit .env.production with your values and run this script again." -ForegroundColor Yellow
        }
    }
    
    Read-Host "Press Enter to exit"
    exit 1
}

# Load environment variables
Write-Host "[INFO] Loading production environment..." -ForegroundColor Yellow
$envVars = Get-EnvVariables -FilePath $envFile

Write-Host "[SUCCESS] Loaded $($envVars.Count) environment variables" -ForegroundColor Green

# Validate required environment variables
$requiredVars = @("DOMAIN", "DISCORD_TOKEN", "JWT_SECRET", "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_GUILD_ID")
$missingVars = Test-RequiredEnvVars -EnvVars $envVars -RequiredVars $requiredVars

if ($missingVars.Count -gt 0) {
    Write-Host "[ERROR] Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Please edit .env.production and add the missing variables." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[SUCCESS] All required environment variables are set" -ForegroundColor Green

# Check SSL certificate
if (-not $SkipSSLCheck) {
    Write-Host "[INFO] Checking SSL certificate..." -ForegroundColor Yellow
    
    $domain = $envVars["DOMAIN"]
    $sslPaths = @(
        "ssl-data\conf\live\$domain\fullchain.pem",
        "C:\Certbot\live\$domain\fullchain.pem",
        "ssl-data\conf\live\$domain\fullchain.pem"
    )
    
    $sslFound = $false
    foreach ($path in $sslPaths) {
        if (Test-Path $path) {
            Write-Host "[SUCCESS] SSL certificate found: $path" -ForegroundColor Green
            $sslFound = $true
            break
        }
    }
    
    if (-not $sslFound) {
        Write-Host "[WARNING] SSL certificate not found for $domain" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "SSL certificate locations checked:" -ForegroundColor White
        foreach ($path in $sslPaths) {
            Write-Host "  - $path" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "To generate SSL certificate, run:" -ForegroundColor Yellow
        Write-Host "  .\setup-ssl.ps1 $domain" -ForegroundColor White
        Write-Host ""
        
        if (-not $Force) {
            $continue = Read-Host "Continue without SSL? (y/N)"
            if ($continue -ne 'y' -and $continue -ne 'Y') {
                exit 1
            }
            Write-Host "[WARNING] Starting without SSL - HTTPS will not work!" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[INFO] Skipping SSL certificate check" -ForegroundColor Yellow
}

# Create necessary directories
Write-Host "[INFO] Creating necessary directories..." -ForegroundColor Yellow
$directories = @("data", "logs", "backups")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "[SUCCESS] Created directory: $dir" -ForegroundColor Green
    }
}

# Check for existing containers
Write-Host "[INFO] Checking for existing containers..." -ForegroundColor Yellow
try {
    $existingContainers = docker-compose -f docker-compose.prod.yml ps -q
    if ($existingContainers) {
        Write-Host "[INFO] Found existing containers" -ForegroundColor Yellow
        if (-not $Force) {
            $restart = Read-Host "Restart existing containers? (Y/n)"
            if ($restart -eq 'n' -or $restart -eq 'N') {
                Write-Host "[INFO] Keeping existing containers running" -ForegroundColor Yellow
                $skipDeploy = $true
            }
        }
    }
} catch {
    # No existing containers, continue
}

if (-not $skipDeploy) {
    # Pull latest images
    Write-Host "[INFO] Pulling latest Docker images..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml pull
        Write-Host "[SUCCESS] Images updated" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Failed to pull some images, continuing..." -ForegroundColor Yellow
    }

    # Build and start containers
    Write-Host "[INFO] Starting production containers..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes for the first run..." -ForegroundColor Gray
    
    try {
        $composeArgs = @(
            "-f", "docker-compose.prod.yml",
            "--env-file", ".env.production",
            "up", "-d", "--build"
        )
        
        & docker-compose $composeArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Containers started successfully" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to start containers" -ForegroundColor Red
            throw "Docker compose failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "[ERROR] Failed to start production environment: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "1. Check Docker Desktop is running" -ForegroundColor White
        Write-Host "2. Verify .env.production settings" -ForegroundColor White
        Write-Host "3. Check container logs: docker-compose -f docker-compose.prod.yml logs" -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Wait for services to start
Write-Host "[INFO] Waiting for services to initialize..." -ForegroundColor Yellow
$timeout = 30
$elapsed = 0
$interval = 2

do {
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    
    $health = Test-ContainerHealth -ComposeFile "docker-compose.prod.yml"
    Write-Host "[$elapsed/$timeout s] Container health: $($health.Healthy)/$($health.Total) ($($health.Percentage)%)" -ForegroundColor Gray
    
    if ($health.Percentage -eq 100) {
        break
    }
} while ($elapsed -lt $timeout)

# Check final container status
Write-Host ""
Write-Host "[INFO] Final Container Status:" -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.prod.yml ps
    
    # Show container health details
    $health = Test-ContainerHealth -ComposeFile "docker-compose.prod.yml"
    if ($health.Percentage -eq 100) {
        Write-Host "[SUCCESS] All containers are healthy" -ForegroundColor Green
    } elseif ($health.Percentage -gt 0) {
        Write-Host "[WARNING] Some containers may not be fully ready ($($health.Percentage)%)" -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] Containers are not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Could not check container status" -ForegroundColor Red
}

# Show access information
$domain = $envVars["DOMAIN"]
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Production Deployment Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Yellow
Write-Host "   Frontend:  https://$domain" -ForegroundColor Green
Write-Host "   API:       https://$domain/api" -ForegroundColor Green
Write-Host "   Docs:      https://$domain/api/docs" -ForegroundColor Green
Write-Host "   Health:    https://$domain/health" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
Write-Host "   View Logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Stop:      docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "   Restart:   .\start-production.ps1 -Force" -ForegroundColor White
Write-Host "   Status:    docker-compose -f docker-compose.prod.yml ps" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor Yellow
Write-Host "   Container Stats: docker stats" -ForegroundColor White
Write-Host "   System Usage:   docker system df" -ForegroundColor White
Write-Host ""

# Show quick health check
Write-Host "🔍 Quick Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$domain/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Application is responding" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Application returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Application not reachable (this may be normal if SSL is not configured)" -ForegroundColor Yellow
}

# Check SSL certificate expiry
if (Test-Path "ssl-data\conf\live\$domain\fullchain.pem") {
    try {
        $certInfo = docker run --rm -v "$PWD\ssl-data\conf\live\${domain}:/certs" alpine/openssl x509 -enddate -noout -in /certs/fullchain.pem 2>$null
        if ($certInfo -match "notAfter=(.+)") {
            $expiryDate = [DateTime]::ParseExact($matches[1], "MMM dd HH:mm:ss yyyy GMT", $null)
            $daysUntilExpiry = ($expiryDate - (Get-Date)).Days
            
            if ($daysUntilExpiry -lt 30) {
                Write-Host "   ⚠️  SSL certificate expires in $daysUntilExpiry days" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ SSL certificate valid for $daysUntilExpiry days" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ❓ Could not check SSL certificate expiry" -ForegroundColor Gray
    }
}

Write-Host ""
if ($health.Percentage -lt 100) {
    Write-Host "⚠️  Some services may still be starting. Check logs if issues persist:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
}

# Optionally show logs
if (-not $NoLogs -and -not $skipDeploy) {
    $showLogs = Read-Host "Show live logs? (y/N)"
    if ($showLogs -eq 'y' -or $showLogs -eq 'Y') {
        Write-Host ""
        Write-Host "Showing live logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
        docker-compose -f docker-compose.prod.yml logs -f
    }
}

Write-Host ""
Write-Host "🎉 Production environment is ready!" -ForegroundColor Green
Write-Host "Visit https://$domain to access your application" -ForegroundColor Cyan
