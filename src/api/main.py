from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from src.database.database import Database

# Import auth after database is available
try:
    from src.api.auth import (
        exchange_discord_code,
        create_jwt_token,
        get_current_user,
        require_admin,
        require_website_access,
        get_user_guild_member_info,
        validate_jwt_secret,
        DiscordCallbackData,
        AuthUser,
        REQUIRED_GUILD_ID,
        ADMIN_ROLE_IDS,
        ADMIN_USER_IDS,
        GUEST_USER_IDS,
        ALLOWED_ROLE_IDS,
    )
    AUTH_AVAILABLE = True
except ImportError as e:
    # Logger not yet configured — use print so the error is visible
    print(f"WARNING: Auth module not available — authentication disabled: {e}")
    AUTH_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# ── Environment ───────────────────────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
IS_PRODUCTION = ENVIRONMENT == "production"

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── FastAPI app — Swagger disabled in production ──────────────────────────────
app = FastAPI(
    title="Requiem Tracking API",
    description="API for Discord user tracking data",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Security-headers middleware ───────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"          # modern browsers ignore this; CSP is the right tool
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# ── CORS — origins read from env for production ───────────────────────────────
_default_origins = "http://localhost:3000,http://localhost:3001"
_cors_origins_raw = os.getenv("CORS_ORIGINS", _default_origins)
CORS_ORIGINS = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Global database instance ──────────────────────────────────────────────────
db = None

# ── Pydantic models ───────────────────────────────────────────────────────────

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
    user_id: str
    old_value: Optional[str]
    new_value: Optional[str]
    timestamp: datetime
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    role_color: Optional[int] = None
    action: Optional[str] = None


class RoleChange(BaseModel):
    role_id: int
    role_name: Optional[str]
    role_color: Optional[int]
    action: str
    timestamp: datetime


class DatabaseStats(BaseModel):
    user_count: int
    username_changes: int
    nickname_changes: int
    role_changes: int
    join_leave_events: int = 0


class WeeklyActivityDay(BaseModel):
    name: str
    changes: int


class GameProfileRequest(BaseModel):
    game_name: str = Field(..., min_length=1, max_length=80)
    character_name: str = Field(..., min_length=1, max_length=80)
    server: Optional[str] = Field(None, max_length=80)
    role_class: Optional[str] = Field(None, max_length=60)


class AchievementRequest(BaseModel):
    game_name: str = Field(..., min_length=1, max_length=80)
    title: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    # Expected format: YYYY-MM-DD  (validated loosely; DB stores as TEXT)
    achieved_at: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')


# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    global db
    if AUTH_AVAILABLE:
        validate_jwt_secret()  # Exits immediately if secret is insecure

    db_path = os.getenv('DATABASE_PATH', './data/tracking.db')
    db = Database(db_path)
    await db.initialize()
    logger.info("API server started and database initialized")

    if AUTH_AVAILABLE:
        import asyncio
        from src.api.auth import clear_expired_codes
        asyncio.create_task(clear_expired_codes())


@app.on_event("shutdown")
async def shutdown_event():
    if db:
        await db.close()
    logger.info("API server shutdown complete")


# ── Public endpoints ──────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "Requiem Tracking API", "version": "1.0.0"}


@app.get("/api/achievements")
async def get_achievements(game_name: Optional[str] = Query(None, max_length=80)):
    """Public — clan achievements, optionally filtered by game."""
    return await db.get_clan_achievements(game_name=game_name)


@app.get("/api/landing-stats")
async def get_landing_stats():
    """Public — aggregate stats for the landing page."""
    guild_id = int(REQUIRED_GUILD_ID) if REQUIRED_GUILD_ID else None
    if not guild_id:
        return {"member_count": 0, "role_count": 0, "days_active": 0}
    return await db.get_landing_stats(guild_id=guild_id)


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/api/auth/discord/callback")
@limiter.limit("10/minute")
async def discord_auth_callback(request: Request, data: DiscordCallbackData):
    """Handle Discord OAuth2 callback — rate-limited to 10 requests/min per IP."""
    if not AUTH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Authentication not configured")

    try:
        discord_data = await exchange_discord_code(data.code)
        user_data = discord_data['user']

        user_id = user_data['id']
        is_admin_user = user_id in ADMIN_USER_IDS
        is_guest_user = user_id in GUEST_USER_IDS

        roles = []
        if REQUIRED_GUILD_ID:
            try:
                member_info = await get_user_guild_member_info(
                    discord_data['access_token'],
                    REQUIRED_GUILD_ID,
                    user_data['id'],
                )
                roles = member_info.get('roles', [])
            except Exception as e:
                logger.warning("Could not get guild member info: %s", e)
                if not (is_admin_user or is_guest_user):
                    raise HTTPException(
                        status_code=403,
                        detail="User not found in required Discord server",
                    )

        token = create_jwt_token(user_data, roles)

        computed_is_admin = is_admin_user or any(
            r.get('role_id', '') in ADMIN_ROLE_IDS for r in roles
        )
        if computed_is_admin or is_guest_user:
            computed_has_access = True
        elif ALLOWED_ROLE_IDS:
            computed_has_access = any(r.get('role_id', '') in ALLOWED_ROLE_IDS for r in roles)
        else:
            computed_has_access = bool(roles)

        return {
            "token": token,
            "user": {
                "user_id": user_data['id'],
                "username": user_data['username'],
                "discriminator": user_data['discriminator'],
                "avatar_url": (
                    f"https://cdn.discordapp.com/avatars/{user_data['id']}/{user_data['avatar']}.png"
                    if user_data.get('avatar') else None
                ),
                "roles": roles,
                "is_admin": computed_is_admin,
                "is_guest": is_guest_user,
                "has_website_access": computed_has_access,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Discord auth callback error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication failed")


@app.get("/api/auth/me")
async def get_current_user_info(current_user: AuthUser = Depends(get_current_user)):
    """Return current user with a live role re-check from the database."""
    if not REQUIRED_GUILD_ID:
        return current_user

    try:
        fresh_member = await get_user_guild_member_info("", REQUIRED_GUILD_ID, current_user.user_id)
        fresh_roles = fresh_member.get("roles", [])
    except Exception as e:
        logger.warning("Could not refresh roles for user %s: %s", current_user.user_id, e)
        # Return conservative defaults on DB error — do not surface elevated stale claims
        return AuthUser(
            user_id=current_user.user_id,
            username=current_user.username,
            discriminator=current_user.discriminator,
            avatar_url=current_user.avatar_url,
            roles=[],
            is_admin=False,
            is_guest=current_user.user_id in GUEST_USER_IDS,
            has_website_access=False,
        )

    is_guest = current_user.is_guest
    is_admin = (
        current_user.user_id in ADMIN_USER_IDS
        or any(r.get("role_id", "") in ADMIN_ROLE_IDS for r in fresh_roles)
    )

    if is_admin or is_guest:
        has_website_access = True
    elif ALLOWED_ROLE_IDS:
        has_website_access = any(r.get("role_id", "") in ALLOWED_ROLE_IDS for r in fresh_roles)
    else:
        has_website_access = bool(fresh_roles)

    return AuthUser(
        user_id=current_user.user_id,
        username=current_user.username,
        discriminator=current_user.discriminator,
        avatar_url=current_user.avatar_url,
        roles=fresh_roles,
        is_admin=is_admin,
        is_guest=is_guest,
        has_website_access=has_website_access,
    )


# ── Admin tracking endpoints (require admin role) ─────────────────────────────

@app.get("/api/admin/database-stats", response_model=DatabaseStats)
async def get_database_stats(current_user: AuthUser = Depends(require_admin)):
    """Admin — overall database statistics."""
    try:
        stats = await db.get_database_stats()
        return DatabaseStats(
            user_count=stats.get('user_count', 0),
            username_changes=stats.get('username_changes', 0),
            nickname_changes=stats.get('nickname_changes', 0),
            role_changes=stats.get('role_changes', 0),
            join_leave_events=stats.get('join_leave_events', 0),
        )
    except Exception as e:
        logger.error("Error getting database stats: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


# ── Member tracking endpoints (require website access) ───────────────────────

@app.get("/api/users/{user_id}/stats", response_model=UserStats)
async def get_user_stats(
    user_id: str,
    current_user: AuthUser = Depends(require_website_access),
):
    """Member — statistics for a specific user."""
    try:
        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            cursor = await conn.execute(
                "SELECT username, display_name, avatar_url FROM users WHERE user_id = ?",
                (int(user_id),),
            )
            user_data = await cursor.fetchone()
            if not user_data:
                cursor = await conn.execute(
                    "SELECT user_id, nickname FROM guild_members WHERE user_id = ? LIMIT 1",
                    (int(user_id),),
                )
                guild_data = await cursor.fetchone()
                if guild_data:
                    user_data = (f"User_{user_id}", guild_data[1] or f"User_{user_id}", None)
                else:
                    raise HTTPException(status_code=404, detail="User not found")

        stats = await db.get_user_stats(int(user_id))
        return UserStats(
            user_id=int(user_id),
            username=user_data[0] or f"User_{user_id}",
            display_name=user_data[1] or user_data[0] or f"User_{user_id}",
            avatar_url=user_data[2] if len(user_data) > 2 else None,
            username_changes=stats.get('username_changes', 0),
            nickname_changes=stats.get('nickname_changes', 0),
            role_changes=stats.get('role_changes', 0),
            last_activity=stats.get('last_activity'),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting user stats: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/servers/{guild_id}/stats", response_model=ServerStats)
async def get_server_stats(
    guild_id: int,
    current_user: AuthUser = Depends(require_website_access),
):
    try:
        stats = await db.get_server_stats(guild_id)
        return ServerStats(
            total_users=stats.get('total_users', 0),
            total_username_changes=stats.get('total_username_changes', 0),
            total_nickname_changes=stats.get('total_nickname_changes', 0),
            total_role_changes=stats.get('total_role_changes', 0),
            new_members_24h=stats.get('new_members_24h', 0),
            left_members_24h=stats.get('left_members_24h', 0),
            name_changes_24h=stats.get('name_changes_24h', 0),
        )
    except Exception as e:
        logger.error("Error getting server stats: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/servers/{guild_id}/recent-changes", response_model=List[ChangeEvent])
async def get_recent_changes(
    guild_id: int,
    limit: int = Query(10, ge=1, le=100),
    current_user: AuthUser = Depends(require_website_access),
):
    try:
        changes = await db.get_recent_changes(guild_id, limit)
        return [
            ChangeEvent(
                type=c['type'],
                user_id=str(c['user_id']),
                old_value=c['old_value'],
                new_value=c['new_value'],
                timestamp=c['timestamp'],
                username=c.get('username'),
                display_name=c.get('display_name'),
                avatar_url=c.get('avatar_url'),
                role_id=c.get('role_id'),
                role_name=c.get('role_name'),
                role_color=c.get('role_color'),
                action=c.get('action'),
            )
            for c in changes
        ]
    except Exception as e:
        logger.error("Error getting recent changes: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/users/{user_id}/role-history", response_model=List[RoleChange])
async def get_role_history(
    user_id: str,
    guild_id: int = Query(...),
    current_user: AuthUser = Depends(require_website_access),
):
    try:
        history = await db.get_role_history(int(user_id), guild_id)
        return [
            RoleChange(
                role_id=h['role_id'],
                role_name=h['role_name'],
                role_color=h['role_color'],
                action=h['action'],
                timestamp=h['timestamp'],
            )
            for h in history
        ]
    except Exception as e:
        logger.error("Error getting role history: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/servers/{guild_id}/weekly-activity", response_model=List[WeeklyActivityDay])
async def get_weekly_activity(
    guild_id: int,
    current_user: AuthUser = Depends(require_website_access),
):
    try:
        activity_data = await db.get_weekly_activity(guild_id)
        return [WeeklyActivityDay(name=d['name'], changes=d['changes']) for d in activity_data]
    except Exception as e:
        logger.error("Error getting weekly activity: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/users/{user_id}/current-roles")
async def get_user_current_roles(
    user_id: str,
    guild_id: int = Query(...),
    current_user: AuthUser = Depends(require_website_access),
):
    try:
        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            cursor = await conn.execute(
                """
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
                """,
                (int(user_id), guild_id),
            )
            roles = await cursor.fetchall()

            def _hex(c):
                return f"#{c:06x}" if c else "#99aab5"

            return [
                {"role_id": str(r[0]), "role_name": r[1], "color": _hex(r[2]), "position": r[3]}
                for r in roles
            ]
    except Exception as e:
        logger.error("Error getting user current roles: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/servers/{guild_id}/users/bulk-roles")
async def get_bulk_user_roles(
    guild_id: int,
    user_ids: str = Query(...),
    current_user: AuthUser = Depends(require_website_access),
):
    try:
        user_id_list = [int(uid.strip()) for uid in user_ids.split(',') if uid.strip()]
        if not user_id_list:
            return {}
        if len(user_id_list) > 200:
            raise HTTPException(status_code=400, detail="Too many user IDs (max 200)")

        import aiosqlite
        async with aiosqlite.connect(db.db_path) as conn:
            placeholders = ','.join('?' * len(user_id_list))
            cursor = await conn.execute(
                f"""
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
                """,
                user_id_list + [guild_id],
            )
            rows = await cursor.fetchall()

            def _hex(c):
                return f"#{c:06x}" if c else "#99aab5"

            result: dict = {}
            for row in rows:
                uid = str(row[0])
                result.setdefault(uid, []).append(
                    {"role_id": str(row[1]), "role_name": row[2], "color": _hex(row[3]), "position": row[4]}
                )
            return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting bulk user roles: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/users/search")
@limiter.limit("30/minute")
async def search_users(
    request: Request,
    q: str = Query(..., min_length=2, max_length=100),
    guild_id: int = Query(None),
    role_filter: str = Query(None, max_length=30),
    current_user: AuthUser = Depends(require_website_access),
):
    """Search users — rate-limited to 30 requests/min per IP."""
    try:
        import aiosqlite
        # Default to the configured guild to prevent unrestricted cross-guild search
        if not guild_id and REQUIRED_GUILD_ID:
            guild_id = int(REQUIRED_GUILD_ID)
        async with aiosqlite.connect(db.db_path) as conn:
            if guild_id:
                base_query = """
                    SELECT DISTINCT u.user_id, u.username, u.display_name, u.avatar_url,
                                    u.last_seen, gm.nickname, gm.joined_at
                    FROM users u
                    JOIN guild_members gm ON u.user_id = gm.user_id
                    LEFT JOIN role_changes rc ON u.user_id = rc.user_id AND rc.guild_id = gm.guild_id
                    LEFT JOIN roles r ON rc.role_id = r.role_id
                    WHERE gm.guild_id = ? AND gm.is_active = 1
                """
                params = [guild_id]
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
                base_query += """
                    AND (u.username LIKE ? OR u.display_name LIKE ? OR gm.nickname LIKE ? OR r.name LIKE ?)
                    ORDER BY u.last_seen DESC LIMIT 20
                """
                params.extend([f"%{q}%"] * 4)
                cursor = await conn.execute(base_query, params)
            else:
                cursor = await conn.execute(
                    """
                    SELECT user_id, username, display_name, avatar_url, last_seen,
                           NULL as nickname, NULL as joined_at
                    FROM users
                    WHERE username LIKE ? OR display_name LIKE ?
                    ORDER BY last_seen DESC LIMIT 20
                    """,
                    (f"%{q}%", f"%{q}%"),
                )
            users = await cursor.fetchall()
            return [
                {
                    "user_id": str(u[0]),
                    "username": u[1],
                    "display_name": u[2],
                    "avatar_url": u[3],
                    "last_seen": u[4],
                    "nickname": u[5],
                    "joined_at": u[6],
                }
                for u in users
            ]
    except Exception as e:
        logger.error("Error searching users: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/servers/{guild_id}/users")
async def get_guild_users(
    guild_id: int,
    active_only: bool = Query(True),
    role_filter: str = Query(None, max_length=30),
    current_user: AuthUser = Depends(require_website_access),
):
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
                    "user_id": str(u[0]),
                    "username": u[1],
                    "display_name": u[2],
                    "avatar_url": u[3],
                    "nickname": u[4],
                    "joined_at": u[5],
                }
                for u in users
            ]
    except Exception as e:
        logger.error("Error getting guild users: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/servers/{guild_id}/role-filters")
async def get_role_filters(
    guild_id: int,
    current_user: AuthUser = Depends(require_website_access),
):
    try:
        import aiosqlite
        filter_roles_env = os.getenv('FILTER_ROLES', '')
        default_filter = os.getenv('DEFAULT_FILTER_ROLE', 'all')
        filters = [{"role_id": "all", "role_name": "All Users", "role_color": "#5865f2"}]

        if filter_roles_env:
            role_ids = [r.strip() for r in filter_roles_env.split(',') if r.strip()]
            if role_ids:
                async with aiosqlite.connect(db.db_path) as conn:
                    placeholders = ','.join('?' * len(role_ids))
                    cursor = await conn.execute(
                        f"SELECT role_id, name, color FROM roles WHERE role_id IN ({placeholders}) AND guild_id = ?",
                        role_ids + [guild_id],
                    )
                    roles_data = await cursor.fetchall()

                    def _hex(c):
                        return f"#{c:06x}" if c else "#99aab5"

                    roles_dict = {
                        str(r[0]): {"role_id": str(r[0]), "role_name": r[1], "role_color": _hex(r[2])}
                        for r in roles_data
                    }
                    for rid in role_ids:
                        if rid in roles_dict:
                            filters.append(roles_dict[rid])

        return {"filters": filters, "default_filter": default_filter.strip() or "all"}
    except Exception as e:
        logger.error("Error getting role filters: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


# ── Profile endpoints ─────────────────────────────────────────────────────────

@app.get("/api/profile/me")
async def get_my_profile(current_user: AuthUser = Depends(require_website_access)):
    """Return own profile with game profiles."""
    try:
        game_profiles = await db.get_user_game_profiles(int(current_user.user_id))
    except Exception:
        game_profiles = []
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "discriminator": current_user.discriminator,
        "avatar_url": current_user.avatar_url,
        "roles": current_user.roles,
        "is_admin": current_user.is_admin,
        "game_profiles": game_profiles,
    }


@app.put("/api/profile/game")
async def upsert_game_profile(
    body: GameProfileRequest,
    current_user: AuthUser = Depends(require_website_access),
):
    return await db.upsert_user_game_profile(
        user_id=int(current_user.user_id),
        game_name=body.game_name,
        character_name=body.character_name,
        server=body.server,
        role_class=body.role_class,
    )


@app.delete("/api/profile/game/{profile_id}")
async def delete_game_profile(
    profile_id: int,
    current_user: AuthUser = Depends(require_website_access),
):
    await db.delete_user_game_profile(profile_id, int(current_user.user_id))
    return {"success": True}


# ── Events endpoint (Raid-Helper proxy) ───────────────────────────────────────

@app.get("/api/events")
async def get_events(current_user: AuthUser = Depends(require_website_access)):
    """Upcoming events from Raid-Helper."""
    import httpx as _httpx
    api_key = os.getenv("RAIDHELPER_API_KEY")
    guild_id = REQUIRED_GUILD_ID or os.getenv("DISCORD_GUILD_ID")
    if not api_key or not guild_id:
        return []
    try:
        async with _httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://raid-helper.dev/api/v2/servers/{guild_id}/events",
                headers={"Authorization": api_key},
            )
            if resp.status_code != 200:
                logger.warning("Raid-Helper returned %s", resp.status_code)
                return []
            data = resp.json()
            return data if isinstance(data, list) else data.get("postedEvents", data.get("events", []))
    except Exception as e:
        logger.error("Raid-Helper fetch error: %s", e)
        return []


# ── News endpoint ─────────────────────────────────────────────────────────────

@app.get("/api/news")
async def get_news(
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(require_website_access),
):
    return await db.get_news_posts(limit=limit)


# ── Leaderboard endpoint ──────────────────────────────────────────────────────

@app.get("/api/leaderboard")
async def get_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    current_user: AuthUser = Depends(require_website_access),
):
    guild_id = int(REQUIRED_GUILD_ID) if REQUIRED_GUILD_ID else None
    if not guild_id:
        return []
    return await db.get_leaderboard(guild_id=guild_id, limit=limit)


# ── Admin achievement endpoints ───────────────────────────────────────────────

@app.post("/api/admin/achievements")
async def create_achievement(
    body: AchievementRequest,
    current_user: AuthUser = Depends(require_admin),
):
    achievement_id = await db.add_clan_achievement(
        game_name=body.game_name,
        title=body.title,
        description=body.description,
        achieved_at=body.achieved_at,
        created_by=int(current_user.user_id),
    )
    return {"id": achievement_id, **body.model_dump()}


@app.put("/api/admin/achievements/{achievement_id}")
async def update_achievement(
    achievement_id: int,
    body: AchievementRequest,
    current_user: AuthUser = Depends(require_admin),
):
    await db.update_clan_achievement(
        achievement_id=achievement_id,
        game_name=body.game_name,
        title=body.title,
        description=body.description,
        achieved_at=body.achieved_at,
    )
    return {"id": achievement_id, **body.model_dump()}


@app.delete("/api/admin/achievements/{achievement_id}")
async def delete_achievement(
    achievement_id: int,
    current_user: AuthUser = Depends(require_admin),
):
    await db.delete_clan_achievement(achievement_id)
    return {"success": True}


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={"detail": "Endpoint not found"})


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    host = os.getenv('API_HOST', '127.0.0.1')  # Default to localhost; expose via reverse-proxy
    port = int(os.getenv('API_PORT', 8000))
    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=not IS_PRODUCTION,
        log_level="info",
    )
