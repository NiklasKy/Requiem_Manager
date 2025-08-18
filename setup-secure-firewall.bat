@echo off
echo ========================================
echo    Secure Firewall Setup (HTTPS Only)
echo ========================================
echo.

echo [INFO] Setting up secure firewall rules...

:: Remove existing HTTP rule if it exists
netsh advfirewall firewall delete rule name="HTTP Inbound" protocol=TCP localport=80 2>nul

:: Allow only HTTPS traffic
netsh advfirewall firewall add rule name="HTTPS Inbound" dir=in action=allow protocol=TCP localport=443
echo [SUCCESS] HTTPS (Port 443) allowed

:: Optional: Allow SSH for remote management
set /p allow_ssh="Allow SSH (Port 22) for remote management? (y/N): "
if /i "%allow_ssh%"=="y" (
    netsh advfirewall firewall add rule name="SSH Inbound" dir=in action=allow protocol=TCP localport=22
    echo [SUCCESS] SSH (Port 22) allowed
)

:: Block all other incoming traffic by default
netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound
echo [SUCCESS] Default policy set to block incoming, allow outgoing

:: Show current firewall rules
echo.
echo [INFO] Current firewall rules:
netsh advfirewall firewall show rule name=all | findstr /i "https\|ssh\|remote"

echo.
echo ========================================
echo    Secure Firewall Configuration Done
echo ========================================
echo.
echo HTTPS Only Mode:
echo - Port 80 (HTTP): BLOCKED
echo - Port 443 (HTTPS): ALLOWED
echo - All other ports: BLOCKED (default)
echo.
echo IMPORTANT: Make sure you have SSL certificate
echo before using HTTPS-only mode!
echo.
pause
