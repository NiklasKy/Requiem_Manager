@echo off
setlocal enabledelayedexpansion

REM Requiem Tracking System Startup Script for Windows

echo [STARTING] Requiem Tracking System...

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found! Please copy .env.example to .env and configure it.
    echo         copy .env.example .env
    echo         Edit the .env file with your Discord bot token and guild ID.
    pause
    exit /b 1
)

REM Read environment variables from .env file
for /f "usebackq tokens=1,2 delims==" %%a in (.env) do (
    if not "%%a"=="" if not "%%b"=="" (
        set "%%a=%%b"
    )
)

REM Check required environment variables
if "%DISCORD_TOKEN%"=="your_discord_bot_token_here" (
    echo [ERROR] DISCORD_TOKEN not set in .env file!
    echo         Please set your Discord bot token in the .env file.
    pause
    exit /b 1
)

if "%DISCORD_TOKEN%"=="" (
    echo [ERROR] DISCORD_TOKEN not set in .env file!
    echo         Please set your Discord bot token in the .env file.
    pause
    exit /b 1
)

if "%DISCORD_GUILD_ID%"=="your_guild_id_here" (
    echo [ERROR] DISCORD_GUILD_ID not set in .env file!
    echo         Please set your Discord guild ID in the .env file.
    pause
    exit /b 1
)

if "%DISCORD_GUILD_ID%"=="" (
    echo [ERROR] DISCORD_GUILD_ID not set in .env file!
    echo         Please set your Discord guild ID in the .env file.
    pause
    exit /b 1
)

REM Create necessary directories
echo [INFO] Creating directories...
if not exist data mkdir data
if not exist logs mkdir logs

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running! Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose not found! Please install Docker Desktop with docker-compose.
    pause
    exit /b 1
)

REM Determine which compose file to use
set "COMPOSE_FILE=docker-compose.yml"
if "%1"=="dev" (
    set "COMPOSE_FILE=docker-compose.dev.yml"
    echo [INFO] Starting in development mode...
) else (
    echo [INFO] Starting in production mode...
)

REM Stop any existing containers
echo [INFO] Stopping existing containers...
docker-compose -f %COMPOSE_FILE% down

REM Build and start containers
echo [INFO] Building and starting containers...
docker-compose -f %COMPOSE_FILE% up --build -d

REM Wait a moment for services to start
echo [INFO] Waiting for services to start...
timeout /t 5 /nobreak >nul

REM Check container status
echo [INFO] Container status:
docker-compose -f %COMPOSE_FILE% ps

echo.
echo [SUCCESS] Requiem Tracking System started successfully!
echo.
echo Frontend: http://localhost:3001
echo API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo To view logs:
echo   docker-compose -f %COMPOSE_FILE% logs -f
echo.
echo To stop the system:
echo   docker-compose -f %COMPOSE_FILE% down
echo.
echo Press any key to continue...
pause >nul
