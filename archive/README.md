# Archive

This folder contains outdated scripts and files that are no longer needed for the current deployment architecture but are kept for reference purposes.

## Outdated Files

### PowerShell Scripts
- `setup-cloudflare-ssl.ps1` - Old SSL setup script for internal Nginx (no longer used)
- `start-production-clean.ps1` - Old production start script for internal Nginx (no longer used)

## Current Deployment

The Requiem Manager project now uses a **separate Edge-Proxy** for SSL termination and HTTPS routing.

For current deployment instructions, see:
- [README.md](../README.md) - Main project documentation
- [CLOUDFLARE_SSL_SETUP.md](../docs/CLOUDFLARE_SSL_SETUP.md) - Current SSL setup guide

## Migration

These scripts were used before migrating to the external Nginx proxy architecture. The external proxy handles:
- SSL certificate management
- HTTPS termination
- Reverse proxy routing
- Load balancing (if needed)

The external proxy project is located at: `F:\#Communitys\Nginx Proxy\`
