@echo off
echo ========================================
echo   Requiem Manager - Production Stop
echo ========================================
echo.

:: Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running.
    echo.
    pause
    exit /b 1
)

:: Stop containers
echo [INFO] Stopping production containers...
docker-compose -f docker-compose.prod.yml down

:: Optional: Remove volumes (ask user)
set /p remove_data="Remove data volumes? This will delete all data! (y/N): "
if /i "%remove_data%"=="y" (
    echo [WARNING] Removing all data...
    docker-compose -f docker-compose.prod.yml down -v
    if exist "data" rmdir /s /q data
    if exist "logs" rmdir /s /q logs
)

echo.
echo [INFO] Production environment stopped.
echo.
pause
