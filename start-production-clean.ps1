# Requiem Manager - Production Start Script (Clean Version)
param(
    [switch]$SkipSSLCheck,
    [switch]$Force,
    [switch]$NoLogs
)

function Write-ColorMessage {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Get-EnvFile {
    param($FilePath)
    $env = @{}
    if (Test-Path $FilePath) {
        Get-Content $FilePath | ForEach-Object {
            if ($_ -match '^([^#][^=]*?)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim() -replace '^["'']|["'']$'
                $env[$key] = $value
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    return $env
}

# Header
Write-ColorMessage "========================================" "Cyan"
Write-ColorMessage "   Requiem Manager - Production Start" "Cyan"
Write-ColorMessage "========================================" "Cyan"
Write-ColorMessage ""

# Check Docker
Write-ColorMessage "[INFO] Checking Docker..." "Yellow"
if (-not (Test-DockerRunning)) {
    Write-ColorMessage "[ERROR] Docker is not running!" "Red"
    Write-ColorMessage "Please start Docker Desktop and try again." "White"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-ColorMessage "[SUCCESS] Docker is running" "Green"

# Check .env.production
if (-not (Test-Path ".env.production")) {
    Write-ColorMessage "[ERROR] .env.production file not found!" "Red"
    Write-ColorMessage "Please create .env.production with your configuration." "White"
    
    if (Test-Path ".env.example") {
        $create = Read-Host "Copy .env.example to .env.production? (y/N)"
        if ($create -eq 'y') {
            Copy-Item ".env.example" ".env.production"
            Write-ColorMessage "[SUCCESS] Created .env.production" "Green"
            Write-ColorMessage "Please edit it with your values and run again." "Yellow"
        }
    }
    Read-Host "Press Enter to exit"
    exit 1
}

# Load environment
Write-ColorMessage "[INFO] Loading environment..." "Yellow"
$env = Get-EnvFile ".env.production"

# Validate required variables
$required = @("DOMAIN", "DISCORD_TOKEN", "JWT_SECRET")
$missing = @()
foreach ($var in $required) {
    if (-not $env.ContainsKey($var) -or [string]::IsNullOrEmpty($env[$var])) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-ColorMessage "[ERROR] Missing required variables:" "Red"
    $missing | ForEach-Object { Write-ColorMessage "  - $_" "White" }
    Read-Host "Press Enter to exit"
    exit 1
}

Write-ColorMessage "[SUCCESS] Environment loaded" "Green"

# Debug: Show loaded environment variables
Write-ColorMessage ""
Write-ColorMessage "🔍 Loaded Environment Variables:" "Cyan"
$debugVars = @("DOMAIN", "DISCORD_CLIENT_ID", "DISCORD_REDIRECT_URI", "DISCORD_GUILD_ID", "ADMIN_USER_IDS", "GUEST_USER_IDS", "FILTER_ROLES", "DEFAULT_FILTER_ROLE")
foreach ($var in $debugVars) {
    if ($env.ContainsKey($var) -and -not [string]::IsNullOrEmpty($env[$var])) {
        $value = $env[$var]
        # Mask sensitive values
        if ($var -like "*SECRET*" -or $var -like "*TOKEN*") {
            $value = "*****"
        } elseif ($var -eq "DISCORD_CLIENT_ID" -and $value.Length -gt 8) {
            $value = $value.Substring(0, 8) + "****"
        }
        Write-ColorMessage "   $var = $value" "White"
    } else {
        Write-ColorMessage "   $var = (not set)" "Yellow"
    }
}
Write-ColorMessage ""

# Check SSL certificate
if (-not $SkipSSLCheck) {
    Write-ColorMessage "[INFO] Checking SSL certificate..." "Yellow"
    $domain = $env["DOMAIN"]
    $sslPath = "ssl-data\conf\live\$domain\fullchain.pem"
    
    if (Test-Path $sslPath) {
        Write-ColorMessage "[SUCCESS] SSL certificate found: $sslPath" "Green"
    } else {
        Write-ColorMessage "[WARNING] SSL certificate not found!" "Yellow"
        Write-ColorMessage "Expected location: $sslPath" "Gray"
        Write-ColorMessage "Run: .\setup-ssl.ps1 $domain" "White"
        
        if (-not $Force) {
            $continue = Read-Host "Continue without SSL? (y/N)"
            if ($continue -ne 'y') {
                exit 1
            }
        }
        Write-ColorMessage "[WARNING] Starting without SSL" "Yellow"
    }
}

# Create directories
Write-ColorMessage "[INFO] Creating directories..." "Yellow"
@("data", "logs", "backups") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-ColorMessage "[CREATED] $_" "Green"
    }
}

# Check existing containers
$restart = $true
if (-not $Force) {
    try {
        $existing = docker-compose -f docker-compose.prod.yml ps -q 2>$null
        if ($existing) {
            $action = Read-Host "Containers exist. (R)estart, (S)kip, or (Q)uit? [R/s/q]"
            if ($action -eq 's') { $restart = $false }
            if ($action -eq 'q') { exit 0 }
        }
    } catch {
        # No existing containers
    }
}

if ($restart) {
    # Pull images
    Write-ColorMessage "[INFO] Pulling Docker images..." "Yellow"
    try {
        docker-compose -f docker-compose.prod.yml pull
        Write-ColorMessage "[SUCCESS] Images updated" "Green"
    } catch {
        Write-ColorMessage "[WARNING] Could not pull all images" "Yellow"
    }

    # Start containers
    Write-ColorMessage "[INFO] Starting containers..." "Yellow"
    try {
        docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
        if ($LASTEXITCODE -eq 0) {
            Write-ColorMessage "[SUCCESS] Containers started" "Green"
        } else {
            throw "Docker compose failed"
        }
    } catch {
        Write-ColorMessage "[ERROR] Failed to start containers: $_" "Red"
        Write-ColorMessage "Check: docker-compose -f docker-compose.prod.yml logs" "White"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Wait and check status
Write-ColorMessage "[INFO] Waiting for services..." "Yellow"
Start-Sleep 10

Write-ColorMessage "[INFO] Container status:" "Yellow"
docker-compose -f docker-compose.prod.yml ps

# Success message
$domain = $env["DOMAIN"]
Write-ColorMessage ""
Write-ColorMessage "========================================" "Cyan"
Write-ColorMessage "   Production Deployment Complete!" "Cyan"
Write-ColorMessage "========================================" "Cyan"
Write-ColorMessage ""
Write-ColorMessage "🌐 Application URLs:" "Yellow"
Write-ColorMessage "   Frontend:  https://$domain" "Green"
Write-ColorMessage "   API:       https://$domain/api" "Green"
Write-ColorMessage "   Docs:      https://$domain/api/docs" "Green"
Write-ColorMessage ""
Write-ColorMessage "🔧 Management:" "Yellow"
Write-ColorMessage "   Logs: docker-compose -f docker-compose.prod.yml logs -f" "White"
Write-ColorMessage "   Stop: docker-compose -f docker-compose.prod.yml down" "White"
Write-ColorMessage ""

# Quick health check
Write-ColorMessage "🔍 Health Check:" "Yellow"
try {
    $response = Invoke-WebRequest "https://$domain/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-ColorMessage "   ✅ Application responding (Status: $($response.StatusCode))" "Green"
} catch {
    Write-ColorMessage "   ⚠️  Application not yet reachable" "Yellow"
}

# Show logs option
if (-not $NoLogs -and $restart) {
    $showLogs = Read-Host "Show live logs? (y/N)"
    if ($showLogs -eq 'y') {
        Write-ColorMessage ""
        Write-ColorMessage "Live logs (Ctrl+C to exit):" "Yellow"
        docker-compose -f docker-compose.prod.yml logs -f
    }
}

Write-ColorMessage ""
Write-ColorMessage "🎉 Ready! Visit https://$domain" "Green"
