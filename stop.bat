@echo off

REM Requiem Tracking System Stop Script for Windows

echo [STOPPING] Requiem Tracking System...

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose not found! Please install Docker Desktop with docker-compose.
    pause
    exit /b 1
)

REM Stop production containers
if exist docker-compose.yml (
    echo [INFO] Stopping production containers...
    docker-compose -f docker-compose.yml down
)

REM Stop development containers  
if exist docker-compose.dev.yml (
    echo [INFO] Stopping development containers...
    docker-compose -f docker-compose.dev.yml down
)

echo [SUCCESS] Requiem Tracking System stopped successfully!

REM Optionally clean up (uncomment if needed)
REM echo [INFO] Cleaning up unused containers and images...
REM docker system prune -f

echo Press any key to continue...
pause >nul
