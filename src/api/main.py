from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from src.database.database import Database

# Import auth after database is available
try:
    from src.api.auth import (
        exchange_discord_code, 
        create_jwt_token, 
        get_current_user, 
        require_admin,
        get_user_guild_member_info,
        DiscordCallbackData,
        AuthUser,
        REQUIRED_GUILD_ID,
        ADMIN_ROLE_IDS,
        ADMIN_USER_IDS
    )
    AUTH_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Auth module not available - authentication disabled: {e}")
    AUTH_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Pydantic models for API responses
class UserStats(BaseModel):
    user_id: int
    username: str
    display_name: str
    avatar_url: Optional[str]
    username_changes: int
    nickname_changes: int
    role_changes: int
    last_activity: Optional[datetime]

class ServerStats(BaseModel):
    total_users: int
    total_username_changes: int
    total_nickname_changes: int
    total_role_changes: int
    new_members_24h: int
    left_members_24h: int
    name_changes_24h: int

class ChangeEvent(BaseModel):
    type: str
    user_id: str  # Changed to string to prevent JavaScript precision loss
    old_value: Optional[str]
    new_value: Optional[str]
    timestamp: datetime
    # User info
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    # Role-specific fields (only for role changes)
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    role_color: Optional[int] = None  # Discord role colors are integers
    action: Optional[str] = None

class RoleChange(BaseModel):
    role_id: int
    role_name: Optional[str]
    role_color: Optional[int]  # Discord role colors are integers
    action: str
    timestamp: datetime

class DatabaseStats(BaseModel):
    user_count: int
    username_changes: int
    nickname_changes: int
    role_changes: int

class WeeklyActivityDay(BaseModel):
    name: str
    changes: int

# Initialize FastAPI app
app = FastAPI(
    title="Requiem Tracking API",
    description="API for Discord user tracking data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React dev server
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Global database instance
db = None

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    global db
    db_path = os.getenv('DATABASE_PATH', './data/tracking.db')
    db = Database(db_path)
    await db.initialize()
    logger.info("API server started and database initialized")
    
    # Start code cleanup task if auth is available
    if AUTH_AVAILABLE:
        import asyncio
        from src.api.auth import clear_expired_codes
        asyncio.create_task(clear_expired_codes())

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    if db:
        await db.close()
    logger.info("API server shutdown complete")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Requiem Tracking API",
        "version": "1.0.0",
        "endpoints": {
            "user_stats": "/api/users/{user_id}/stats",
            "server_stats": "/api/servers/{guild_id}/stats",
            "recent_changes": "/api/servers/{guild_id}/recent-changes",
            "role_history": "/api/users/{user_id}/role-history",
            "database_stats": "/api/admin/database-stats"
        }
    }

@app.get("/api/users/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: str):
    """Get statistics for a specific user"""
    try:
        # Get basic user info from database first
        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            # Try users table first
            cursor = await conn.execute("""
                SELECT username, display_name, avatar_url FROM users WHERE user_id = ?
            """, (int(user_id),))
            user_data = await cursor.fetchone()
            
            # If not in users table, try guild_members table and create fallback
            if not user_data:
                cursor = await conn.execute("""
                    SELECT gm.user_id, gm.nickname 
                    FROM guild_members gm
                    WHERE gm.user_id = ?
                    LIMIT 1
                """, (int(user_id),))
                guild_data = await cursor.fetchone()
                
                if guild_data:
                    # Create fallback user data
                    username = f"User_{user_id}"
                    display_name = guild_data[1] or username  # Use nickname if available
                    user_data = (username, display_name, None)  # No avatar_url for fallback
                else:
                    raise HTTPException(status_code=404, detail="User not found")
        
        # Get stats (returns empty dict if no stats found)
        stats = await db.get_user_stats(int(user_id))
        
        return UserStats(
            user_id=int(user_id),
            username=user_data[0] or f"User_{user_id}",
            display_name=user_data[1] or user_data[0] or f"User_{user_id}",
            avatar_url=user_data[2] if len(user_data) > 2 else None,
            username_changes=stats.get('username_changes', 0),
            nickname_changes=stats.get('nickname_changes', 0),
            role_changes=stats.get('role_changes', 0),
            last_activity=stats.get('last_activity')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/servers/{guild_id}/stats", response_model=ServerStats)
async def get_server_stats(guild_id: int):
    """Get statistics for a specific server"""
    try:
        stats = await db.get_server_stats(guild_id)
        
        return ServerStats(
            total_users=stats.get('total_users', 0),
            total_username_changes=stats.get('total_username_changes', 0),
            total_nickname_changes=stats.get('total_nickname_changes', 0),
            total_role_changes=stats.get('total_role_changes', 0),
            new_members_24h=stats.get('new_members_24h', 0),
            left_members_24h=stats.get('left_members_24h', 0),
            name_changes_24h=stats.get('name_changes_24h', 0)
        )
        
    except Exception as e:
        logger.error(f"Error getting server stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/servers/{guild_id}/recent-changes", response_model=List[ChangeEvent])
async def get_recent_changes(guild_id: int, limit: int = Query(10, ge=1, le=100)):
    """Get recent username, nickname, and role changes for a server"""
    try:
        changes = await db.get_recent_changes(guild_id, limit)
        
        return [
            ChangeEvent(
                type=change['type'],
                user_id=str(change['user_id']),  # Convert to string to prevent JavaScript precision loss
                old_value=change['old_value'],
                new_value=change['new_value'],
                timestamp=change['timestamp'],
                username=change.get('username'),
                display_name=change.get('display_name'),
                avatar_url=change.get('avatar_url'),
                role_id=change.get('role_id'),
                role_name=change.get('role_name'),
                role_color=change.get('role_color'),
                action=change.get('action')
            )
            for change in changes
        ]
        
    except Exception as e:
        logger.error(f"Error getting recent changes: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/users/{user_id}/role-history", response_model=List[RoleChange])
async def get_role_history(user_id: str, guild_id: int = Query(...)):
    """Get role change history for a user in a specific guild"""
    try:
        history = await db.get_role_history(int(user_id), guild_id)
        
        return [
            RoleChange(
                role_id=change['role_id'],
                role_name=change['role_name'],
                role_color=change['role_color'],
                action=change['action'],
                timestamp=change['timestamp']
            )
            for change in history
        ]
        
    except Exception as e:
        logger.error(f"Error getting role history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/servers/{guild_id}/weekly-activity", response_model=List[WeeklyActivityDay])
async def get_weekly_activity(guild_id: int):
    """Get weekly activity statistics for a server"""
    try:
        activity_data = await db.get_weekly_activity(guild_id)
        
        return [
            WeeklyActivityDay(
                name=day['name'],
                changes=day['changes']
            )
            for day in activity_data
        ]
        
    except Exception as e:
        logger.error(f"Error getting weekly activity: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/admin/database-stats", response_model=DatabaseStats)
async def get_database_stats():
    """Get overall database statistics (admin endpoint)"""
    try:
        stats = await db.get_database_stats()
        
        return DatabaseStats(
            user_count=stats.get('user_count', 0),
            username_changes=stats.get('username_changes', 0),
            nickname_changes=stats.get('nickname_changes', 0),
            role_changes=stats.get('role_changes', 0),
            join_leave_events=stats.get('join_leave_events', 0)
        )
        
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/users/{user_id}/current-roles")
async def get_user_current_roles(user_id: str, guild_id: int = Query(...)):
    """Get current active roles for a user in a guild"""
    try:
        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            # Get current roles using JOIN with roles table for better data consistency
            cursor = await conn.execute("""
                SELECT rc.role_id, r.name, r.color, r.position
                FROM role_changes rc
                INNER JOIN (
                    SELECT role_id, user_id, MAX(changed_at) as latest_change
                    FROM role_changes 
                    WHERE user_id = ? AND guild_id = ?
                    GROUP BY role_id, user_id
                ) latest ON rc.role_id = latest.role_id 
                           AND rc.user_id = latest.user_id 
                           AND rc.changed_at = latest.latest_change
                INNER JOIN roles r ON rc.role_id = r.role_id
                WHERE rc.action IN ('added', 'initial')
                ORDER BY r.position DESC
            """, (int(user_id), guild_id))
            
            roles = await cursor.fetchall()
            
            def int_to_hex_color(color_int):
                """Convert Discord color integer to hex string"""
                if color_int is None or color_int == 0:
                    return "#99aab5"  # Discord default role color
                return f"#{color_int:06x}"
            
            return [
                {
                    "role_id": str(role[0]),
                    "role_name": role[1],
                    "color": int_to_hex_color(role[2]),
                    "position": role[3]
                }
                for role in roles
            ]
        
    except Exception as e:
        logger.error(f"Error getting user current roles: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/servers/{guild_id}/users/bulk-roles")
async def get_bulk_user_roles(guild_id: int, user_ids: str = Query(...)):
    """Get current active roles for multiple users in a guild (bulk operation)"""
    try:
        # Parse comma-separated user IDs
        user_id_list = [int(uid.strip()) for uid in user_ids.split(',') if uid.strip()]
        
        if not user_id_list:
            return {}
        
        # Limit to prevent abuse
        if len(user_id_list) > 1000:
            raise HTTPException(status_code=400, detail="Too many user IDs (max 1000)")
        
        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            # Create placeholders for the IN clause
            placeholders = ','.join('?' * len(user_id_list))
            
            # Get current roles for all users in one query
            cursor = await conn.execute(f"""
                SELECT rc.user_id, rc.role_id, r.name, r.color, r.position
                FROM role_changes rc
                INNER JOIN (
                    SELECT role_id, user_id, MAX(changed_at) as latest_change
                    FROM role_changes 
                    WHERE user_id IN ({placeholders}) AND guild_id = ?
                    GROUP BY role_id, user_id
                ) latest ON rc.role_id = latest.role_id 
                           AND rc.user_id = latest.user_id 
                           AND rc.changed_at = latest.latest_change
                INNER JOIN roles r ON rc.role_id = r.role_id
                WHERE rc.action IN ('added', 'initial')
                ORDER BY rc.user_id, r.position DESC
            """, user_id_list + [guild_id])
            
            roles_data = await cursor.fetchall()
            
            def int_to_hex_color(color_int):
                """Convert Discord color integer to hex string"""
                if color_int is None or color_int == 0:
                    return "#99aab5"  # Discord default role color
                return f"#{color_int:06x}"
            
            # Group roles by user_id
            user_roles = {}
            for row in roles_data:
                user_id = str(row[0])
                role_data = {
                    "role_id": str(row[1]),
                    "role_name": row[2],
                    "color": int_to_hex_color(row[3]),
                    "position": row[4]
                }
                
                if user_id not in user_roles:
                    user_roles[user_id] = []
                user_roles[user_id].append(role_data)
            
            return user_roles
        
    except Exception as e:
        logger.error(f"Error getting bulk user roles: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/users/search")
async def search_users(
    q: str = Query(..., min_length=2), 
    guild_id: int = Query(None), 
    role_filter: str = Query(None, description="Filter by specific role ID")
):
    """Search for users by username, display name, or role name with optional role filtering"""
    try:
        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            if guild_id:
                # Base query for guild-specific search
                base_query = """
                    SELECT DISTINCT u.user_id, u.username, u.display_name, u.avatar_url, u.last_seen, gm.nickname, gm.joined_at
                    FROM users u
                    JOIN guild_members gm ON u.user_id = gm.user_id
                    LEFT JOIN role_changes rc ON u.user_id = rc.user_id AND rc.guild_id = gm.guild_id
                    LEFT JOIN roles r ON rc.role_id = r.role_id
                    WHERE gm.guild_id = ? AND gm.is_active = 1
                """
                
                params = [guild_id]
                
                # Add role filter if specified
                if role_filter and role_filter != "all":
                    base_query += """
                        AND u.user_id IN (
                            SELECT DISTINCT rc2.user_id 
                            FROM role_changes rc2
                            INNER JOIN (
                                SELECT role_id, user_id, MAX(changed_at) as latest_change
                                FROM role_changes 
                                WHERE guild_id = ? AND role_id = ?
                                GROUP BY role_id, user_id
                            ) latest ON rc2.role_id = latest.role_id 
                                       AND rc2.user_id = latest.user_id 
                                       AND rc2.changed_at = latest.latest_change
                            WHERE rc2.action IN ('added', 'initial') AND rc2.role_id = ?
                        )
                    """
                    params.extend([guild_id, role_filter, role_filter])
                
                # Add search conditions
                base_query += """
                    AND (
                        u.username LIKE ? OR 
                        u.display_name LIKE ? OR 
                        gm.nickname LIKE ? OR
                        r.name LIKE ?
                    )
                    ORDER BY u.last_seen DESC
                    LIMIT 20
                """
                params.extend([f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"])
                
                cursor = await conn.execute(base_query, params)
            else:
                # Search by username or display name only (global search)
                cursor = await conn.execute("""
                    SELECT user_id, username, display_name, avatar_url, last_seen, NULL as nickname, NULL as joined_at
                    FROM users 
                    WHERE username LIKE ? OR display_name LIKE ?
                    ORDER BY last_seen DESC
                    LIMIT 20
                """, (f"%{q}%", f"%{q}%"))
            
            users = await cursor.fetchall()
            
            return [
                {
                    "user_id": str(user[0]),  # Convert to string to prevent JS precision loss
                    "username": user[1],
                    "display_name": user[2],
                    "avatar_url": user[3],
                    "last_seen": user[4],
                    "nickname": user[5],
                    "joined_at": user[6]
                }
                for user in users
            ]
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/servers/{guild_id}/users")
async def get_guild_users(
    guild_id: int, 
    active_only: bool = Query(True), 
    role_filter: str = Query(None, description="Filter by specific role ID")
):
    """Get users in a specific guild with optional role filtering"""
    try:
        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            query = """
                SELECT u.user_id, u.username, u.display_name, u.avatar_url, gm.nickname, gm.joined_at
                FROM users u
                JOIN guild_members gm ON u.user_id = gm.user_id
                WHERE gm.guild_id = ?
            """
            
            params = [guild_id]
            
            if active_only:
                query += " AND gm.is_active = TRUE"
            
            # Add role filter if specified
            if role_filter and role_filter != "all":
                query += """
                    AND u.user_id IN (
                        SELECT DISTINCT rc.user_id 
                        FROM role_changes rc
                        INNER JOIN (
                            SELECT role_id, user_id, MAX(changed_at) as latest_change
                            FROM role_changes 
                            WHERE guild_id = ? AND role_id = ?
                            GROUP BY role_id, user_id
                        ) latest ON rc.role_id = latest.role_id 
                                   AND rc.user_id = latest.user_id 
                                   AND rc.changed_at = latest.latest_change
                        WHERE rc.action IN ('added', 'initial') AND rc.role_id = ?
                    )
                """
                params.extend([guild_id, role_filter, role_filter])
            
            query += " ORDER BY gm.joined_at DESC"
            
            cursor = await conn.execute(query, params)
            users = await cursor.fetchall()
            
            return [
                {
                    "user_id": str(user[0]),  # Convert to string to prevent JS precision loss
                    "username": user[1],
                    "display_name": user[2],
                    "avatar_url": user[3],
                    "nickname": user[4],
                    "joined_at": user[5]
                }
                for user in users
            ]
        
    except Exception as e:
        logger.error(f"Error getting guild users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/servers/{guild_id}/role-filters")
async def get_role_filters(guild_id: int):
    """Get available role filters from environment configuration and database"""
    try:
        import os
        import aiosqlite
        
        # Get filter role IDs and default filter from environment
        filter_roles_env = os.getenv('FILTER_ROLES', '')
        default_filter = os.getenv('DEFAULT_FILTER_ROLE', 'all')
        
        # Default "All" filter
        filters = [
            {
                "role_id": "all",
                "role_name": "All Users",
                "role_color": "#5865f2"
            }
        ]
        
        # Parse filter role IDs and fetch details from database
        if filter_roles_env:
            role_ids = [role_id.strip() for role_id in filter_roles_env.split(',') if role_id.strip()]
            
            if role_ids:
                async with aiosqlite.connect(db.db_path) as conn:
                    # Create placeholders for the IN clause
                    placeholders = ','.join('?' * len(role_ids))
                    
                    # Fetch role details from database
                    cursor = await conn.execute(f"""
                        SELECT role_id, name, color
                        FROM roles 
                        WHERE role_id IN ({placeholders}) AND guild_id = ?
                    """, role_ids + [guild_id])
                    
                    roles_data = await cursor.fetchall()
                    
                    def int_to_hex_color(color_int):
                        """Convert Discord color integer to hex string"""
                        if color_int is None or color_int == 0:
                            return "#99aab5"  # Default Discord color
                        return f"#{color_int:06x}"
                    
                    # Create a dictionary for fast lookup
                    roles_dict = {
                        str(role_data[0]): {
                            "role_id": str(role_data[0]),
                            "role_name": role_data[1],
                            "role_color": int_to_hex_color(role_data[2])
                        }
                        for role_data in roles_data
                    }
                    
                    # Add roles in the order specified in .env
                    for role_id in role_ids:
                        if role_id in roles_dict:
                            filters.append(roles_dict[role_id])
        
        return {
            "filters": filters,
            "default_filter": default_filter.strip() if default_filter else "all"
        }
        
    except Exception as e:
        logger.error(f"Error getting role filters: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )

@app.get("/api/debug/users")
async def debug_users():
    """Debug endpoint to see users in database"""
    import aiosqlite
    async with aiosqlite.connect(db.db_path) as conn:
        cursor = await conn.execute("SELECT user_id, username, display_name FROM users LIMIT 10")
        users = await cursor.fetchall()
        
        cursor_gm = await conn.execute("SELECT user_id FROM guild_members LIMIT 10")
        guild_members = await cursor_gm.fetchall()
        
        # Check for missing users
        cursor_missing = await conn.execute("""
            SELECT gm.user_id FROM guild_members gm 
            LEFT JOIN users u ON gm.user_id = u.user_id 
            WHERE u.user_id IS NULL
        """)
        missing_users = await cursor_missing.fetchall()
        
        return {
            "users_table": [{"user_id": str(row[0]), "username": row[1], "display_name": row[2]} for row in users],
            "guild_members_table": [{"user_id": str(row[0])} for row in guild_members],
            "missing_from_users": [{"user_id": str(row[0])} for row in missing_users]
        }

@app.post("/api/debug/fix-missing-users")
async def fix_missing_users():
    """Fix users that are in guild_members but not in users table"""
    import aiosqlite
    async with aiosqlite.connect(db.db_path) as conn:
        # Find missing users
        cursor_missing = await conn.execute("""
            SELECT gm.user_id, gm.nickname FROM guild_members gm 
            LEFT JOIN users u ON gm.user_id = u.user_id 
            WHERE u.user_id IS NULL
        """)
        missing_users = await cursor_missing.fetchall()
        
        # Insert them with fallback data
        fixed_count = 0
        for user_id, nickname in missing_users:
            username = f"User_{user_id}"
            display_name = nickname or username
            
            await conn.execute("""
                INSERT INTO users (user_id, username, display_name, first_seen, last_seen, is_bot)
                VALUES (?, ?, ?, datetime('now'), datetime('now'), 0)
            """, (user_id, username, display_name))
            fixed_count += 1
        
        await conn.commit()
        return {"fixed_users": fixed_count, "missing_users": missing_users}

# Auth endpoints
@app.post("/api/auth/discord/callback")
async def discord_auth_callback(data: DiscordCallbackData):
    """Handle Discord OAuth2 callback"""
    print(f"DEBUG: Auth callback called with data: {data}")
    print(f"DEBUG: AUTH_AVAILABLE = {AUTH_AVAILABLE}")
    
    if not AUTH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Authentication not configured")
    
    try:
        # Exchange code for user data
        print(f"DEBUG: About to exchange Discord code: {data.code}")
        discord_data = await exchange_discord_code(data.code)
        print(f"DEBUG: Discord data received: {discord_data}")
        user_data = discord_data['user']
        print(f"DEBUG: User data extracted: {user_data}")
        
        # Get user roles from our database if they're in the guild
        roles = []
        if REQUIRED_GUILD_ID:
            try:
                member_info = await get_user_guild_member_info(
                    discord_data['access_token'], 
                    REQUIRED_GUILD_ID, 
                    user_data['id']
                )
                roles = member_info.get('roles', [])
            except Exception as e:
                logger.warning(f"Could not get guild member info: {e}")
        
        # Create JWT token
        token = create_jwt_token(user_data, roles)
        
        # Return user data and token
        return {
            "token": token,
            "user": {
                "user_id": user_data['id'],
                "username": user_data['username'],
                "discriminator": user_data['discriminator'],
                "avatar_url": f"https://cdn.discordapp.com/avatars/{user_data['id']}/{user_data['avatar']}.png" if user_data['avatar'] else None,
                "roles": roles,
                "is_admin": (
                    any(role.get('role_id', '') in ADMIN_ROLE_IDS for role in roles) or
                    user_data['id'] in ADMIN_USER_IDS
                )
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Discord auth callback error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.get("/api/auth/me")
async def get_current_user_info(current_user: AuthUser = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', 8000))
    
    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
