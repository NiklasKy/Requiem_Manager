# Requiem Discord User Tracking System

A comprehensive Discord bot system for tracking user activities with a modern React-based dashboard, automated message scheduling, and AI-powered activity recognition.

## 📑 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Architecture](#️-architecture)
- [Discord Bot Commands](#-discord-bot-commands)
- [Dashboard Features](#-dashboard-features)
- [Database Schema](#️-database-schema)
- [Docker Deployment](#-docker-deployment)
- [Development](#-development)
- [Security](#-security)
- [Documentation](#-documentation)
- [Support](#-support)

## 🌟 Features

- **Discord Bot** with Cogs architecture and Slash Commands
- **User Tracking**: Username, nickname, and role changes with complete history
- **Message Scheduler**: Automated recurring messages with role pings and embed support
- **Activity Recognition**: AI-powered game screenshot analysis using OpenAI Vision API
- **SQLite Database** for persistent data storage with optimized indexes
- **REST API** with FastAPI for secure data access
- **React Dashboard** with modern glassmorphism design
- **Docker Containers** for production-ready deployment
- **Real-time Updates** and comprehensive event logging
- **Dark/Light Mode** with system preference detection
- **Discord OAuth2 Authentication** with role-based access control

## 📋 Prerequisites

- Docker and Docker Compose
- Discord Bot Token ([Create Bot](https://discord.com/developers/applications))
- Discord Guild (Server) ID
- Discord OAuth2 Application credentials
- OpenAI API Key (for activity recognition feature)
- External Nginx Proxy for SSL termination (optional, for production HTTPS)

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

Edit the `.env` file with your credentials:
```env
# Discord Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here

# Discord OAuth2 (for Dashboard Authentication)
DISCORD_CLIENT_ID=your_oauth_client_id_here
DISCORD_CLIENT_SECRET=your_oauth_client_secret_here

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API (for Activity Recognition)
OPENAI_API_KEY=your_openai_api_key_here

# Admin & Moderator Configuration (Discord User/Role IDs)
ADMIN_ROLE_IDS=123456789012345678,987654321098765432
ADMIN_USER_IDS=242292116833697792
MOD_ROLE_IDS=123456789012345678,987654321098765432
```

### 3. Start System

**Production Mode:**
```bash
# Create external network (one-time setup)
docker network create edge-proxy

# Start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

**Development Mode** (with hot-reload):
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Access Dashboard
- **Frontend Dashboard**: http://localhost:3001
- **API Documentation**: http://localhost:8000/docs
- **API Endpoint**: http://localhost:8000

## 🏗️ Architecture

### Deployment Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   Edge-Proxy (Nginx)                        │
│             SSL Termination & Reverse Proxy                 │
│                   (Separate Project)                        │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │ edge-proxy network             │
             │                                │
      ┌──────▼──────┐                  ┌──────▼────────┐
      │ requiem-api │                  │requiem-frontend│
      │  (FastAPI)  │                  │    (React)     │
      └─────────────┘                  └────────────────┘
             │
             │ requiem-network
             │
      ┌──────▼──────┐
      │ requiem-bot │
      │  (Discord)  │
      └─────────────┘
```

**Networks:**
- `edge-proxy`: External network for communication with reverse proxy (HTTPS)
- `requiem-network`: Internal network for inter-service communication

### Project Structure
```
Requiem_Manager/
├── src/
│   ├── bot/                          # Discord Bot
│   │   ├── main.py                   # Bot entry point
│   │   └── cogs/                     # Bot command modules
│   │       ├── tracking.py           # User tracking commands
│   │       ├── admin.py              # Admin commands
│   │       ├── scheduler.py          # Message scheduler
│   │       ├── raidhelper.py         # Raid helper integration
│   │       └── activity_recognition.py  # AI-powered screenshot analysis
│   ├── database/                     # Database layer
│   │   └── database.py               # SQLite handler with migrations
│   └── api/                          # REST API
│       ├── main.py                   # FastAPI server
│       └── auth.py                   # OAuth2 & JWT authentication
├── frontend/                         # React Dashboard
│   ├── src/
│   │   ├── components/               # Reusable React components
│   │   ├── pages/                    # Dashboard pages
│   │   ├── contexts/                 # React contexts (Auth, Theme)
│   │   └── services/                 # API service layer
│   └── package.json
├── docs/                             # Documentation
│   ├── DISCORD_OAUTH_SETUP.md        # OAuth2 setup guide
│   ├── ADMIN_CONFIGURATION.md        # Admin system configuration
│   ├── ACTIVITY_RECOGNITION_GUIDE.md # Activity recognition setup
│   ├── MESSAGE_SCHEDULER_GUIDE.md    # Message scheduler usage
│   ├── CLOUDFLARE_SSL_SETUP.md       # SSL certificate setup
│   └── ...
├── docker-compose.prod.yml           # Production containers
├── docker-compose.dev.yml            # Development containers
├── Dockerfile.bot                    # Bot container definition
├── Dockerfile.api                    # API container definition
├── Dockerfile.frontend               # Frontend container definition
├── requirements.txt                  # Python dependencies
└── .env.example                      # Environment variables template
```

## 🤖 Discord Bot Commands

### User Commands
- `/user_stats [user]` - Display statistics for a specific user
- `/recent_changes [limit]` - Show recent username/nickname changes
- `/role_history <user>` - View complete role change history for a user
- `/server_stats` - Display comprehensive server statistics
- `/analyze_activity <image1> [image2-5]` - Analyze game activity screenshots to extract member names and weekly activity points using AI

### Admin Commands
*Requires Administrator permissions or configured Admin/Mod roles*

- `/sync` - Synchronize slash commands with Discord
- `/database_stats` - View database statistics and health metrics
- `/cleanup_old_data [days]` - Remove data older than specified days
- `/export_user_data <user>` - Export complete data for a specific user
- `/cleanup_duplicate_roles` - Remove duplicate initial role entries

### Message Scheduler Commands
*Requires Administrator permissions or configured Admin/Mod roles*

- `/schedule_list` - List all scheduled messages with status
- `/schedule_add` - Create a new scheduled message with interval and role pings
- `/schedule_edit <message_id>` - Edit an existing scheduled message
- `/schedule_remove <message_id>` - Delete a scheduled message
- `/schedule_toggle <message_id>` - Enable or disable a scheduled message

📚 **Detailed Guide:** See [Message Scheduler Documentation](docs/MESSAGE_SCHEDULER_GUIDE.md)

## 📊 Dashboard Features

### Available Pages
- **Main Dashboard**: Server overview with real-time statistics and glassmorphism design
- **User List**: Browse all users with search functionality and role filtering
- **User Details**: Detailed user profile with statistics and complete history
- **Recent Changes**: Comprehensive log of username and nickname changes
- **Admin Panel**: System status, database statistics, and management tools

### Authentication & Security
- **Discord OAuth2** integration for secure login
- **Role-based access control** with configurable admin and moderator roles
- **JWT tokens** for secure session management
- **Protected routes** with automatic permission checks
- **Refresh token** support for seamless sessions

### Tracked Events
- User joins and leaves server
- Username changes with timestamps
- Nickname changes with before/after values
- Role additions and removals with complete history
- Initial inventory of all existing guild members

### Design Features
- **Modern Glassmorphism UI** with backdrop blur effects
- **Dark/Light mode** with automatic system preference detection
- **Discord-inspired color palette** for familiar user experience
- **Smooth animations** and hover effects
- **Responsive design** for desktop, tablet, and mobile
- **Interactive user cards** with dynamic role displays
- **Professional data visualization** with charts and graphs

## 🗄️ Database Schema

### Core Tables
- `users` - User basic information (ID, username, avatar)
- `guild_members` - Guild-specific member data
- `roles` - Role information with colors and positions
- `username_changes` - Complete username change history
- `nickname_changes` - Nickname change tracking
- `role_changes` - Role addition and removal events
- `join_leave_events` - Server join and leave tracking
- `scheduled_messages` - Automated message scheduling data

**Features:**
- Optimized with indexes for fast queries
- Automatic schema migrations
- Support for data cleanup and archiving
- Foreign key constraints for data integrity

## 🐳 Docker Deployment

### Production Deployment

> **⚠️ IMPORTANT**: The Requiem Manager project uses a **separate Edge-Proxy** for SSL termination and HTTPS routing.

**Setup Steps:**
1. **Set up Edge-Proxy**: See [Nginx Proxy Project](https://github.com/NiklasKy/Nginx)
2. **Create Edge-Proxy Network**: `docker network create edge-proxy`
3. **Configure SSL Certificates**: Follow [Cloudflare SSL Setup Guide](docs/CLOUDFLARE_SSL_SETUP.md)
4. **Start Requiem Manager**: `docker-compose -f docker-compose.prod.yml up -d --build`

**Standard Deployment:**
```bash
# 1. Create edge-proxy network (one-time setup)
docker network create edge-proxy

# 2. Start all services
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Check logs
docker-compose -f docker-compose.prod.yml logs -f

# 4. Check service status
docker-compose -f docker-compose.prod.yml ps
```

**For SSL setup details, see:** [Cloudflare SSL Setup Guide](docs/CLOUDFLARE_SSL_SETUP.md)

### Development Deployment

**Hot-Reload Development Mode:**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Container Services
- **requiem-bot**: Discord bot with automatic restart
- **requiem-api**: FastAPI backend accessible via `edge-proxy` network
- **requiem-frontend**: React frontend served via `edge-proxy` network

### Health Checks
All containers include health checks for monitoring:
```bash
# Check container health
docker ps

# View detailed health status
docker inspect --format='{{json .State.Health}}' requiem-bot
```

## 🔧 Development

### Local Development (without Docker)

**Backend Setup:**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start Discord Bot
python -m src.bot.main

# Start API Server (in separate terminal)
python -m src.api.main
```

**Frontend Setup:**
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Environment Configuration

**Complete Environment Variables:**
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=your_oauth_client_id_here
DISCORD_CLIENT_SECRET=your_oauth_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3001/auth/callback

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Configuration (comma-separated IDs)
ADMIN_ROLE_IDS=123456789012345678,987654321098765432
ADMIN_USER_IDS=242292116833697792

# Moderator Configuration (comma-separated IDs)
MOD_ROLE_IDS=123456789012345678,987654321098765432

# OpenAI Configuration (for Activity Recognition)
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

### Logging

Logs are automatically written to the `logs/` directory:

```bash
# View all container logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f bot
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f frontend

# View last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 bot
```

## 🛠️ Troubleshooting

### Bot Issues
**Bot won't start:**
- Verify Discord token is correct
- Check bot has required Privileged Gateway Intents enabled:
  - Server Members Intent
  - Message Content Intent (if using message commands)
- Confirm Guild ID is correct
- Check container logs: `docker-compose logs bot`

**Commands not showing:**
- Use `/sync` command to synchronize slash commands
- Wait a few minutes for Discord to propagate commands
- Check bot has `applications.commands` scope in OAuth2 URL

### API Issues
**API not reachable:**
- Verify port 8000 is not in use by another application
- Check container status: `docker ps`
- View API logs: `docker-compose logs api`
- Test health endpoint: `curl http://localhost:8000/health`

**CORS errors:**
- Verify `REACT_APP_API_URL` matches API URL
- Check API CORS configuration in `src/api/main.py`
- Ensure frontend and API are on same domain/port in production

### Frontend Issues
**Dashboard won't load:**
- Check API is running and accessible
- Verify `REACT_APP_API_URL` is correctly set
- Check browser console for errors
- View frontend logs: `docker-compose logs frontend`

**Authentication fails:**
- Verify Discord OAuth2 credentials are correct
- Check redirect URI matches exactly (including protocol and port)
- Ensure `JWT_SECRET` is set and consistent
- Confirm user is a member of the configured guild
- Clear browser cookies and retry

### Database Issues
**Database errors:**
- Check `data/` folder exists and has correct permissions
- Verify SQLite file is created: `ls -la data/`
- Check database logs in container logs
- Try manual database check: `sqlite3 data/tracking.db ".schema"`

**Migration failures:**
- Database migrations run automatically on startup
- Check bot logs for migration errors
- Backup database before manual intervention
- Contact support with error logs

## 📈 Performance

- **Optimized SQLite** with indexes on frequently queried columns
- **Automatic cleanup** of old data via Admin Panel
- **Container health checks** for automatic restart on failure
- **Efficient API endpoints** with pagination support
- **React optimizations** using useCallback, useMemo, and lazy loading
- **Caching strategies** for frequently accessed data
- **Connection pooling** for database operations

## 🔒 Security

- **Environment variables** for all sensitive credentials (no hardcoded secrets)
- **JWT authentication** with token expiration and refresh
- **API CORS protection** with configurable origins
- **Role-based access control** for admin features
- **Discord OAuth2** for secure user authentication
- **SQL injection protection** through parameterized queries
- **Container security** with non-root users (recommended for production)
- **Rate limiting** on API endpoints (configurable)
- **Input validation** on all user inputs

## 📚 Documentation

Comprehensive guides available in the `docs/` folder:

### Setup Guides
- [Discord OAuth2 Setup Guide](docs/DISCORD_OAUTH_SETUP.md) - Complete OAuth2 configuration
- [Admin Configuration Guide](docs/ADMIN_CONFIGURATION.md) - Configure admin and moderator roles
- [Cloudflare SSL Setup Guide](docs/CLOUDFLARE_SSL_SETUP.md) - Production HTTPS setup

### Feature Guides
- [Activity Recognition Guide](docs/ACTIVITY_RECOGNITION_GUIDE.md) - AI-powered screenshot analysis setup
- [Message Scheduler Guide](docs/MESSAGE_SCHEDULER_GUIDE.md) - Automated message scheduling usage
- [Message Scheduler Changelog](docs/SCHEDULER_CHANGELOG.md) - Feature history and updates

### Advanced Documentation
- [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) - Detailed production setup (outdated, use this README)
- [Scheduler Test Guide](docs/SCHEDULER_TEST_GUIDE.md) - Testing message scheduler functionality
- [Activity Recognition Changelog](docs/CHANGELOG_ACTIVITY_RECOGNITION.md) - Feature updates and changes

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Code Guidelines:**
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript/React
- Include docstrings for all functions
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Having issues or questions?

1. **Check Documentation**: Review relevant guides in the `docs/` folder
2. **Search Issues**: Look for similar problems in [GitHub Issues](https://github.com/your-repo/issues)
3. **Create New Issue**: If not found, open a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Error messages and logs
   - Environment details (OS, Docker version, etc.)
4. **Provide Logs**: Always include relevant logs from affected services

**Quick Debug Commands:**
```bash
# Check all service status
docker-compose -f docker-compose.prod.yml ps

# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service
docker-compose -f docker-compose.prod.yml logs bot --tail=50

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Rebuild specific service
docker-compose -f docker-compose.prod.yml up -d --build bot
```

---

**Made with ❤️ for the Requiem Community**
