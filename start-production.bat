@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Requiem Manager - Production Start
echo ========================================
echo.

:: Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    echo.
    pause
    exit /b 1
)

:: Check if .env.production exists
if not exist ".env.production" (
    echo [ERROR] .env.production file not found!
    echo Please copy .env.example to .env.production and configure it.
    echo.
    pause
    exit /b 1
)

:: Load environment variables from .env.production
echo [INFO] Loading production environment...
for /f "usebackq tokens=1,* delims==" %%a in (".env.production") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set "%%a=%%b"
    )
)

:: Validate required environment variables
echo [INFO] Validating configuration...
if "!DOMAIN!"=="" (
    echo [ERROR] DOMAIN not set in .env.production
    pause
    exit /b 1
)

if "!DISCORD_TOKEN!"=="" (
    echo [ERROR] DISCORD_TOKEN not set in .env.production
    pause
    exit /b 1
)

if "!JWT_SECRET!"=="" (
    echo [ERROR] JWT_SECRET not set in .env.production
    pause
    exit /b 1
)

:: Check SSL certificate
if not exist "C:\Certbot\live\!DOMAIN!\fullchain.pem" (
    echo [WARNING] SSL certificate not found for !DOMAIN!
    echo Please run: certbot certonly --standalone -d !DOMAIN!
    echo.
    set /p continue="Continue without SSL? (y/N): "
    if /i not "!continue!"=="y" (
        exit /b 1
    )
)

:: Create necessary directories
echo [INFO] Creating directories...
if not exist "data" mkdir data
if not exist "logs" mkdir logs

:: Pull latest images
echo [INFO] Pulling latest Docker images...
docker-compose -f docker-compose.prod.yml pull

:: Build and start containers
echo [INFO] Starting production containers...
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

:: Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

:: Check container status
echo.
echo [INFO] Container Status:
docker-compose -f docker-compose.prod.yml ps

:: Show access information
echo.
echo ========================================
echo    Production Deployment Complete!
echo ========================================
echo.
echo Frontend: https://!DOMAIN!
echo API:      https://!DOMAIN!/api
echo API Docs: https://!DOMAIN!/api/docs
echo.
echo Logs: docker-compose -f docker-compose.prod.yml logs -f
echo Stop: docker-compose -f docker-compose.prod.yml down
echo.
echo [INFO] Check the logs if any services failed to start.
echo.
pause
