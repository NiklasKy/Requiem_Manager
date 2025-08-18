# Requiem Discord User Tracking System

Ein umfassendes Discord Bot System zum Tracken von User-Aktivitäten mit React-basiertem Dashboard.

## 🌟 Features

- **Discord Bot** mit Cogs-Architektur und Slash Commands
- **User Tracking**: Username-, Nickname- und Rollenänderungen
- **SQLite Datenbank** für persistente Datenspeicherung  
- **REST API** mit FastAPI für Datenzugriff
- **React Dashboard** für moderne Datenvisualisierung
- **Docker Container** für einfache Bereitstellung
- **Real-time Updates** und Event-Logging

## 📋 Voraussetzungen

- Docker und Docker Compose
- Discord Bot Token
- Discord Guild (Server) ID

## 🚀 Schnellstart

### 1. Repository klonen
```bash
git clone <repository-url>
cd Requiem_Manager
```

### 2. Umgebungsvariablen konfigurieren
```bash
cp .env.example .env
```

Bearbeite die `.env` Datei und füge deine Discord-Credentials hinzu:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
```

### 3. System starten
```bash
# Produktions-Modus
./start.sh

# Entwicklungs-Modus (mit Hot-Reload)
./start.sh dev
```

### 4. Zugriff
- **Frontend Dashboard**: http://localhost:3000
- **API**: http://localhost:8000  
- **API Dokumentation**: http://localhost:8000/docs

## 🏗️ Architektur

```
Requiem_Manager/
├── src/
│   ├── bot/                    # Discord Bot
│   │   ├── main.py            # Bot Hauptdatei
│   │   └── cogs/              # Bot Kommandos
│   │       ├── tracking.py    # User-Tracking Commands
│   │       └── admin.py       # Admin Commands
│   ├── database/              # Datenbank
│   │   └── database.py        # SQLite Handler
│   └── api/                   # REST API
│       └── main.py            # FastAPI Server
├── frontend/                  # React Dashboard
│   ├── src/
│   │   ├── components/        # React Komponenten
│   │   ├── pages/            # Dashboard Seiten
│   │   └── services/         # API Services
│   └── package.json
├── docker-compose.yml         # Produktions-Container
├── docker-compose.dev.yml     # Entwicklungs-Container
└── start.sh                  # Startup Script
```

## 🤖 Discord Bot Commands

Der Bot bietet folgende Slash Commands:

### User Commands
- `/user_stats [user]` - Statistiken für einen User anzeigen
- `/recent_changes [limit]` - Aktuelle Änderungen anzeigen  
- `/role_history <user>` - Rollenhistorie eines Users
- `/server_stats` - Server-Statistiken anzeigen

### Admin Commands (Administrator erforderlich)
- `/sync` - Slash Commands synchronisieren
- `/database_stats` - Datenbank-Statistiken
- `/cleanup_old_data [days]` - Alte Daten bereinigen
- `/export_user_data <user>` - User-Daten exportieren

## 📊 Dashboard Features

### Dashboard Seiten
- **Hauptdashboard**: Server-Übersicht und Aktivitäten
- **User-Liste**: Alle User mit Suchfunktion
- **User-Details**: Detaillierte User-Statistiken und Rollenhistorie
- **Änderungslog**: Aktuelle Username/Nickname-Änderungen
- **Admin Panel**: System-Status und Datenbank-Statistiken

### Tracked Events
- User beitritt/verlässt Server
- Username-Änderungen  
- Nickname-Änderungen
- Rollenänderungen (hinzugefügt/entfernt)

## 🗄️ Datenbank Schema

### Tabellen
- `users` - User-Grunddaten
- `guild_members` - Guild-spezifische User-Daten
- `username_changes` - Username-Änderungshistorie
- `nickname_changes` - Nickname-Änderungshistorie  
- `role_changes` - Rollenänderungshistorie
- `join_leave_events` - Beitritts-/Verlassen-Events

## 🐳 Docker Setup

### Produktions-Deployment
```bash
docker-compose up -d
```

### Entwicklung mit Hot-Reload
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Container
- **requiem-bot**: Discord Bot Container
- **requiem-api**: FastAPI Backend Container
- **requiem-frontend**: React Frontend Container

## 🔧 Entwicklung

### Lokale Entwicklung
```bash
# Python Dependencies installieren
pip install -r requirements.txt

# Bot lokal starten
python -m src.bot.main

# API lokal starten  
python -m src.api.main

# Frontend lokal starten
cd frontend
npm install
npm start
```

### Environment Variables
```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here

# Database Configuration  
DATABASE_PATH=./data/tracking.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
```

## 📝 Logs

Logs werden automatisch in den `logs/` Ordner geschrieben:
```bash
# Container Logs anzeigen
docker-compose logs -f

# Spezifische Service Logs
docker-compose logs -f bot
docker-compose logs -f api
docker-compose logs -f frontend
```

## 🛠️ Troubleshooting

### Bot startet nicht
- Discord Token überprüfen
- Bot Permissions überprüfen (Privilegierte Gateway Intents)
- Guild ID korrekt setzen

### API nicht erreichbar
- Port 8000 verfügbar?
- Container Status überprüfen: `docker ps`
- API Logs überprüfen: `docker-compose logs api`

### Frontend lädt nicht
- API-Verbindung überprüfen
- CORS-Einstellungen überprüfen
- Frontend Logs überprüfen: `docker-compose logs frontend`

### Datenbank Probleme
- Data-Ordner Permissions überprüfen
- SQLite-Datei erstellt: `ls -la data/`
- Datenbank-Logs überprüfen

## 📈 Performance

- SQLite für optimale Performance mit Indizes
- Automatische Datenbereinigung über Admin Panel
- Container Health Checks
- Efiziente API-Endpoints mit Paginierung

## 🔒 Sicherheit

- Bot Token nur über Environment Variables
- API CORS-Schutz
- Admin Commands nur für Administratoren
- Container mit Non-Root User (empfohlen für Produktion)

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Changes committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 License

Dieses Projekt ist unter der MIT License lizensiert - siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

Bei Problemen oder Fragen:
1. GitHub Issues verwenden
2. Logs und Error Messages bereitstellen
3. Environment und Docker-Version angeben

---

**Made with ❤️ for the Requiem Community**
