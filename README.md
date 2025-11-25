# Requiem Discord User Tracking System

A comprehensive Discord bot system for tracking user activities with a React-based dashboard.

## 🌟 Features

- **Discord Bot** with Cogs architecture and Slash Commands
- **User Tracking**: Username, nickname, and role changes
- **Activity Recognition**: AI-powered game screenshot analysis with OpenAI Vision
- **SQLite Database** for persistent data storage  
- **REST API** with FastAPI for data access
- **React Dashboard** for modern data visualization
- **Docker Containers** for easy deployment
- **Real-time Updates** and event logging
- **Dark/Light Mode** with glassmorphism design
- **Discord OAuth2 Authentication** with role-based access control

## 📋 Prerequisites

- Docker and Docker Compose
- Discord Bot Token
- Discord Guild (Server) ID
- Discord OAuth2 Application (for authentication)
- OpenAI API Key (for activity recognition feature)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd Requiem_Manager
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit the `.env` file and add your Discord credentials:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_CLIENT_ID=your_oauth_client_id_here
DISCORD_CLIENT_SECRET=your_oauth_client_secret_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start System
```bash
# Production Mode
./start.bat
# or
./start.sh

# Development Mode (with Hot-Reload)
./start.bat dev
# or
./start.sh dev
```

### 4. Access
- **Frontend Dashboard**: http://localhost:3001
- **API**: http://localhost:8000  
- **API Documentation**: http://localhost:8000/docs

## 🏗️ Architecture

```
Requiem_Manager/
├── src/
│   ├── bot/                    # Discord Bot
│   │   ├── main.py            # Bot Main File
│   │   └── cogs/              # Bot Commands
│   │       ├── tracking.py    # User-Tracking Commands
│   │       ├── admin.py       # Admin Commands
│   │       └── activity_recognition.py  # Activity Recognition with AI
│   ├── database/              # Database
│   │   └── database.py        # SQLite Handler
│   └── api/                   # REST API
│       ├── main.py            # FastAPI Server
│       └── auth.py            # Authentication System
├── frontend/                  # React Dashboard
│   ├── src/
│   │   ├── components/        # React Components
│   │   ├── pages/            # Dashboard Pages
│   │   ├── contexts/         # React Contexts (Auth, Theme)
│   │   └── services/         # API Services
│   └── package.json
├── docker-compose.yml         # Production Containers
├── docker-compose.dev.yml     # Development Containers
├── start.bat / start.sh       # Startup Scripts
└── stop.bat / stop.sh         # Stop Scripts
```

## 🤖 Discord Bot Commands

The bot provides the following slash commands:

### User Commands
- `/user_stats [user]` - Show statistics for a user
- `/recent_changes [limit]` - Show recent changes  
- `/role_history <user>` - Role history of a user
- `/server_stats` - Show server statistics
- `/analyze_activity <image1> [image2-5]` - Analyze game activity screenshots to extract member names and weekly activity points

### Admin Commands (Administrator required)
- `/sync` - Synchronize slash commands
- `/database_stats` - Database statistics
- `/cleanup_old_data [days]` - Clean up old data
- `/export_user_data <user>` - Export user data
- `/cleanup_duplicate_roles` - Clean up duplicate initial role entries

## 📊 Dashboard Features

### Dashboard Pages
- **Main Dashboard**: Server overview and activities with modern glassmorphism design
- **User List**: All users with search functionality and role filtering
- **User Details**: Detailed user statistics and role history
- **Recent Changes**: Username/nickname change log
- **Admin Panel**: System status and database statistics

### Authentication & Security
- **Discord OAuth2** authentication
- **Role-based access control** with configurable admin roles
- **JWT tokens** for session management
- **Protected routes** and admin-only sections

### Tracked Events
- User joins/leaves server
- Username changes  
- Nickname changes
- Role changes (added/removed)
- Initial inventory of existing members

## 🗄️ Database Schema

### Tables
- `users` - User basic data
- `guild_members` - Guild-specific user data
- `roles` - Role information with colors
- `username_changes` - Username change history
- `nickname_changes` - Nickname change history  
- `role_changes` - Role change history
- `join_leave_events` - Join/leave events

## 🐳 Docker Setup

### Production Deployment
```bash
docker-compose up -d
```

### Development with Hot-Reload
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Containers
- **requiem-bot**: Discord Bot Container
- **requiem-api**: FastAPI Backend Container
- **requiem-frontend**: React Frontend Container

## 🔧 Development

### Local Development
```bash
# Install Python Dependencies
pip install -r requirements.txt

# Start Bot locally
python -m src.bot.main

# Start API locally  
python -m src.api.main

# Start Frontend locally
cd frontend
npm install
npm start
```

### Environment Variables
```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=your_oauth_client_id_here
DISCORD_CLIENT_SECRET=your_oauth_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3001/auth/callback

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Configuration
ADMIN_ROLE_IDS=123456789012345678,987654321098765432
ADMIN_USER_IDS=242292116833697792

# Moderator Configuration
MOD_ROLE_IDS=123456789012345678,987654321098765432

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration  
DATABASE_PATH=./data/tracking.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_DEFAULT_GUILD_ID=your_guild_id_here
REACT_APP_DISCORD_CLIENT_ID=your_oauth_client_id_here
```

## 📝 Logs

Logs are automatically written to the `logs/` folder:
```bash
# View Container Logs
docker-compose logs -f

# Specific Service Logs
docker-compose logs -f bot
docker-compose logs -f api
docker-compose logs -f frontend
```

## 🛠️ Troubleshooting

### Bot Won't Start
- Check Discord token
- Check bot permissions (Privileged Gateway Intents)
- Set correct Guild ID

### API Not Reachable
- Is port 8000 available?
- Check container status: `docker ps`
- Check API logs: `docker-compose logs api`

### Frontend Won't Load
- Check API connection
- Check CORS settings
- Check frontend logs: `docker-compose logs frontend`

### Authentication Issues
- Check Discord OAuth2 configuration
- Verify redirect URIs match exactly
- Check JWT secret is set
- Ensure user is member of configured guild

### Database Problems
- Check data folder permissions
- Verify SQLite file created: `ls -la data/`
- Check database logs

## 📈 Performance

- SQLite optimized with indexes
- Automatic data cleanup via Admin Panel
- Container Health Checks
- Efficient API endpoints with pagination
- Modern React optimizations (useCallback, useMemo)

## 🔒 Security

- Bot token only via Environment Variables
- API CORS protection
- Admin commands only for administrators
- Discord OAuth2 authentication
- JWT token security with expiration
- Role-based access control
- Container with non-root user (recommended for production)

## 🎨 Design Features

- **Modern Glassmorphism UI** with blur effects
- **Dark/Light mode** with system preference detection
- **Discord-inspired color palette**
- **Smooth animations** and hover effects
- **Responsive design** for all screen sizes
- **Interactive user cards** with role displays
- **Professional data visualization** with charts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

For problems or questions:
1. Use GitHub Issues
2. Provide logs and error messages
3. Include environment and Docker version

## 📚 Documentation

- [Discord OAuth2 Setup Guide](DISCORD_OAUTH_SETUP.md)
- [Admin Configuration Guide](ADMIN_CONFIGURATION.md)
- [Activity Recognition Guide](ACTIVITY_RECOGNITION_GUIDE.md) - AI-powered screenshot analysis

---

**Made with ❤️ for the Requiem Community**