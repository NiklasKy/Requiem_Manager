@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    SSL Certificate Setup with Docker
echo ========================================
echo.

:: Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

:: Get domain name
if "%~1"=="" (
    set /p DOMAIN="Enter your domain name (e.g., yourdomain.com): "
) else (
    set DOMAIN=%~1
)

if "!DOMAIN!"=="" (
    echo [ERROR] Domain name is required.
    pause
    exit /b 1
)

echo [INFO] Setting up SSL certificate for: !DOMAIN!
echo.

:: Create directories
if not exist "ssl-data" mkdir ssl-data
if not exist "ssl-data\conf" mkdir ssl-data\conf
if not exist "ssl-data\www" mkdir ssl-data\www

:: Stop any running nginx to free port 80
echo [INFO] Stopping nginx container if running...
docker stop requiem-nginx 2>nul

:: Method 1: Try standalone first (if port 80 is free)
echo [INFO] Attempting standalone certificate generation...
docker run --rm ^
  -p 80:80 ^
  -v "%cd%\ssl-data\conf:/etc/letsencrypt" ^
  -v "%cd%\ssl-data\www:/var/www/certbot" ^
  certbot/certbot ^
  certonly --standalone --email admin@!DOMAIN! --agree-tos --no-eff-email -d !DOMAIN! -d www.!DOMAIN!

if %errorlevel% neq 0 (
    echo [WARNING] Standalone method failed. Trying webroot method...
    echo.
    
    :: Method 2: Webroot method with temporary nginx
    echo [INFO] Starting temporary nginx for webroot validation...
    
    :: Create temporary nginx config
    echo server { > temp-nginx.conf
    echo     listen 80; >> temp-nginx.conf
    echo     server_name !DOMAIN! www.!DOMAIN!; >> temp-nginx.conf
    echo     location /.well-known/acme-challenge/ { >> temp-nginx.conf
    echo         root /var/www/certbot; >> temp-nginx.conf
    echo     } >> temp-nginx.conf
    echo     location / { >> temp-nginx.conf
    echo         return 200 'SSL Setup in Progress'; >> temp-nginx.conf
    echo         add_header Content-Type text/plain; >> temp-nginx.conf
    echo     } >> temp-nginx.conf
    echo } >> temp-nginx.conf
    
    :: Start temporary nginx
    docker run -d --name temp-nginx ^
      -p 80:80 ^
      -v "%cd%\temp-nginx.conf:/etc/nginx/conf.d/default.conf:ro" ^
      -v "%cd%\ssl-data\www:/var/www/certbot" ^
      nginx:alpine
    
    :: Wait a moment for nginx to start
    timeout /t 5 /nobreak >nul
    
    :: Generate certificate using webroot
    docker run --rm ^
      -v "%cd%\ssl-data\conf:/etc/letsencrypt" ^
      -v "%cd%\ssl-data\www:/var/www/certbot" ^
      certbot/certbot ^
      certonly --webroot --webroot-path=/var/www/certbot --email admin@!DOMAIN! --agree-tos --no-eff-email -d !DOMAIN! -d www.!DOMAIN!
    
    :: Clean up temporary nginx
    docker stop temp-nginx 2>nul
    docker rm temp-nginx 2>nul
    del temp-nginx.conf 2>nul
)

:: Check if certificate was created
if exist "ssl-data\conf\live\!DOMAIN!\fullchain.pem" (
    echo.
    echo [SUCCESS] SSL certificate generated successfully!
    echo Certificate location: ssl-data\conf\live\!DOMAIN!\
    echo.
    
    :: Create renewal script
    echo @echo off > renew-ssl.bat
    echo echo [INFO] Renewing SSL certificate... >> renew-ssl.bat
    echo docker run --rm -v "%cd%\ssl-data\conf:/etc/letsencrypt" -v "%cd%\ssl-data\www:/var/www/certbot" certbot/certbot renew --quiet >> renew-ssl.bat
    echo if %%errorlevel%% equ 0 ( >> renew-ssl.bat
    echo     echo [SUCCESS] Certificate renewed >> renew-ssl.bat
    echo     docker-compose -f docker-compose.prod.yml restart nginx 2^>nul >> renew-ssl.bat
    echo ) else ( >> renew-ssl.bat
    echo     echo [ERROR] Certificate renewal failed >> renew-ssl.bat
    echo ) >> renew-ssl.bat
    
    echo [INFO] Created automatic renewal script: renew-ssl.bat
    echo [INFO] Schedule this script to run weekly in Task Scheduler
    echo.
    echo [NEXT] Update your .env.production file with:
    echo DOMAIN=!DOMAIN!
    echo.
    echo [NEXT] Then run: .\start-production.bat
    echo.
    
) else (
    echo.
    echo [ERROR] Certificate generation failed!
    echo.
    echo [MANUAL METHOD] Try this instead:
    echo 1. Go to https://www.sslforfree.com/
    echo 2. Enter domain: !DOMAIN!
    echo 3. Download certificate files
    echo 4. Place them in: ssl-data\conf\live\!DOMAIN!\
    echo    - fullchain.pem
    echo    - privkey.pem
    echo.
)

pause
