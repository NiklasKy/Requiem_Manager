# 🛡️ Admin Configuration Guide

## Overview
Das Requiem Tracking System unterstützt flexible Admin-Konfiguration über Environment Variables.

## Environment Variables

### ADMIN_ROLE_IDS
Definiert Discord-Rollen-IDs, die Admin-Rechte erhalten.

**Format:** Komma-getrennte Liste von Discord Rollen-IDs
```env
ADMIN_ROLE_IDS=123456789012345678,987654321098765432
```

**Beispiele:**
```env
# Development Environment
ADMIN_ROLE_IDS=123456789012345678,456789012345678901

# Production Environment  
ADMIN_ROLE_IDS=987654321098765432,789012345678901234
```

**⚡ Vorteil:** Rollen-IDs bleiben konstant, auch wenn Rollennamen geändert werden!

### ADMIN_USER_IDS
Definiert spezifische Discord User-IDs, die Admin-Rechte erhalten (Fallback für Server-Owner).

**Format:** Komma-getrennte Liste von Discord User-IDs
```env
ADMIN_USER_IDS=242292116833697792,123456789012345678
```

**Beispiele:**
```env
# Einzelner Admin
ADMIN_USER_IDS=242292116833697792

# Mehrere Admins
ADMIN_USER_IDS=242292116833697792,123456789012345678,987654321098765432
```

## Configuration Steps

### 1. .env Datei bearbeiten
```bash
# Kopiere .env.example zu .env falls noch nicht vorhanden
cp .env.example .env

# Bearbeite .env und setze deine Admin-Konfiguration
nano .env
```

### 2. Admin-Rollen für dein Environment setzen

**Development:**
```env
ADMIN_ROLE_IDS=123456789012345678,456789012345678901
ADMIN_USER_IDS=242292116833697792
```

**Production:**
```env
ADMIN_ROLE_IDS=987654321098765432,789012345678901234
ADMIN_USER_IDS=242292116833697792,123456789012345678
```

### 3. Container neustarten
```bash
# Development
./stop.bat && ./start.bat

# Oder einzeln
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

## Admin-Rechte Überprüfung

### Automatische Erkennung
Das System prüft Admin-Rechte in folgender Reihenfolge:

1. **Rollen-ID-basiert:** User hat eine der `ADMIN_ROLE_IDS` in Discord
2. **User-ID-basiert:** User-ID ist in `ADMIN_USER_IDS` definiert

### Debug-Informationen
Admin-Status wird im JWT Token gespeichert und in der Navbar angezeigt:
- ✅ **Admin Badge** wenn Admin-Rechte vorhanden
- 🚫 **Kein Badge** wenn keine Admin-Rechte

## Troubleshooting

### Problem: Keine Admin-Rechte trotz korrekter Rolle
1. **Rolle in Discord prüfen:** Stelle sicher, dass du die Rolle wirklich hast
2. **Rollennamen prüfen:** Case-insensitive, aber exakte Schreibweise
3. **Bot neu laden:** Bot muss Rollen-Änderungen erst synchronisieren
4. **Neu einloggen:** JWT Token muss neu erstellt werden

### Problem: 0 Rollen angezeigt
1. **Bot-Inventarisierung prüfen:** `/initial_inventory` ausführen
2. **Datenbank prüfen:** Rollen müssen in `roles` Tabelle vorhanden sein
3. **Container-Logs prüfen:** Fehler in der Auth-Verarbeitung

### Discord User-ID herausfinden
1. **Discord Developer Mode aktivieren**
2. **Rechtsklick auf deinen Namen → "ID kopieren"**
3. **ID in ADMIN_USER_IDS eintragen**

### Discord Rollen-ID herausfinden
1. **Discord Developer Mode aktivieren** (Einstellungen → Erweitert → Entwicklermodus)
2. **Server-Einstellungen → Rollen** öffnen
3. **Rechtsklick auf die gewünschte Rolle → "ID kopieren"**
4. **ID in ADMIN_ROLE_IDS eintragen**

**Alternative über Bot-Commands:**
```
/info role @RollenName
```

## Security Best Practices

1. **Minimale Rechte:** Nur notwendige Rollen als Admin definieren
2. **User-ID Backup:** Mindestens eine User-ID als Fallback
3. **Environment Separation:** Verschiedene Admin-Konfiguration für Dev/Prod
4. **Regular Review:** Admin-Liste regelmäßig überprüfen

## Examples

### Gaming Guild Setup
```env
ADMIN_ROLE_IDS=123456789012345678,456789012345678901,789012345678901234
ADMIN_USER_IDS=242292116833697792
```

### Development Team Setup
```env
ADMIN_ROLE_IDS=987654321098765432,654321098765432109
ADMIN_USER_IDS=242292116833697792,123456789012345678
```

### Community Server Setup
```env
ADMIN_ROLE_IDS=111222333444555666,777888999000111222,333444555666777888
ADMIN_USER_IDS=242292116833697792
```
