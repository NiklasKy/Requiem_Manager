import os
import sys
import jwt
import httpx
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── Authorization-code replay-protection cache ────────────────────────────────
used_codes: set = set()
code_lock = asyncio.Lock()

async def clear_expired_codes():
    """Clear used OAuth2 code cache every 5 minutes."""
    while True:
        await asyncio.sleep(300)
        async with code_lock:
            used_codes.clear()
            logger.info("Cleared expired authorization codes cache")

# ── JWT Configuration ─────────────────────────────────────────────────────────
_RAW_JWT_SECRET = os.getenv('JWT_SECRET', '')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '8'))

def validate_jwt_secret() -> None:
    """Fail fast if JWT_SECRET is missing, uses the insecure default, or is too short.
    Call this once during application startup.
    """
    insecure_defaults = {
        '',
        'your-super-secret-jwt-key-change-this-in-production',
        'secret',
        'changeme',
        'jwt_secret',
    }
    if _RAW_JWT_SECRET in insecure_defaults:
        logger.critical(
            "SECURITY ERROR: JWT_SECRET is not set or uses an insecure default value. "
            "Generate a strong secret with: python -c \"import secrets; print(secrets.token_hex(32))\" "
            "and set it in your .env file."
        )
        sys.exit(1)
    if len(_RAW_JWT_SECRET) < 32:
        logger.critical(
            f"SECURITY ERROR: JWT_SECRET is too short ({len(_RAW_JWT_SECRET)} chars). "
            "Minimum 32 characters required."
        )
        sys.exit(1)
    logger.info("JWT secret validation passed.")

JWT_SECRET = _RAW_JWT_SECRET  # validated at startup; safe to use after validate_jwt_secret()

# ── Discord OAuth2 Configuration ──────────────────────────────────────────────
DISCORD_CLIENT_ID = os.getenv('DISCORD_CLIENT_ID')
DISCORD_CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET')
DISCORD_REDIRECT_URI = os.getenv('DISCORD_REDIRECT_URI', 'http://localhost:3001/auth/callback')

# ── Guild / Role / User access configuration ──────────────────────────────────
REQUIRED_GUILD_ID = os.getenv('DISCORD_GUILD_ID')

ADMIN_ROLE_IDS = [r.strip() for r in os.getenv('ADMIN_ROLE_IDS', '').split(',') if r.strip()]
ADMIN_USER_IDS = [u.strip() for u in os.getenv('ADMIN_USER_IDS', '').split(',') if u.strip()]
GUEST_USER_IDS = [u.strip() for u in os.getenv('GUEST_USER_IDS', '').split(',') if u.strip()]

# Users must hold at least one of these roles to access the web interface.
# Admins and Guests always bypass this check.
# If left empty, any server member is granted access.
ALLOWED_ROLE_IDS = [r.strip() for r in os.getenv('ALLOWED_ROLE_IDS', '').split(',') if r.strip()]

security = HTTPBearer()


# ── Pydantic models ───────────────────────────────────────────────────────────

class AuthUser(BaseModel):
    user_id: str
    username: str
    discriminator: str
    avatar_url: Optional[str]
    roles: List[Dict]
    is_admin: bool
    is_guest: bool
    has_website_access: bool


class DiscordCallbackData(BaseModel):
    code: str
    state: Optional[str] = None


# ── Discord API helpers ───────────────────────────────────────────────────────

async def exchange_discord_code(code: str) -> dict:
    """Exchange a Discord OAuth2 authorization code for user data.
    Prevents code reuse via an in-memory set.
    """
    async with code_lock:
        if code in used_codes:
            logger.warning("Attempted reuse of authorization code: %s...", code[:10])
            raise HTTPException(status_code=400, detail="Authorization code has already been used")
        used_codes.add(code)

    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Discord OAuth2 not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        token_response = await client.post(
            'https://discord.com/api/oauth2/token',
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'client_id': DISCORD_CLIENT_ID,
                'client_secret': DISCORD_CLIENT_SECRET,
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': DISCORD_REDIRECT_URI,
            },
        )
        if token_response.status_code != 200:
            logger.error("Discord token exchange failed: %s", token_response.text)
            raise HTTPException(status_code=400, detail="Failed to exchange Discord code")

        access_token = token_response.json()['access_token']

        user_response = await client.get(
            'https://discord.com/api/users/@me',
            headers={'Authorization': f'Bearer {access_token}'},
        )
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info from Discord")
        user_data = user_response.json()

        guilds_response = await client.get(
            'https://discord.com/api/users/@me/guilds',
            headers={'Authorization': f'Bearer {access_token}'},
        )
        if guilds_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user guilds from Discord")
        guilds_data = guilds_response.json()

        if REQUIRED_GUILD_ID:
            user_in_guild = any(guild['id'] == REQUIRED_GUILD_ID for guild in guilds_data)
            user_id = user_data['id']
            is_admin_user = user_id in ADMIN_USER_IDS
            is_guest_user = user_id in GUEST_USER_IDS
            if not user_in_guild and not (is_admin_user or is_guest_user):
                raise HTTPException(
                    status_code=403,
                    detail="You must be a member of the required Discord server",
                )

        return {
            'user': user_data,
            'guilds': guilds_data,
            'access_token': access_token,
        }


async def get_user_guild_member_info(access_token: str, guild_id: str, user_id: str) -> dict:
    """Fetch a user's current roles from the local database."""
    import aiosqlite
    from .main import db  # deferred import to avoid circular dependency at module load

    try:
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
                (int(user_id), int(guild_id)),
            )
            roles = await cursor.fetchall()

            def _hex(c):
                return f"#{c:06x}" if c else "#99aab5"

            return {
                'roles': [
                    {"role_id": str(r[0]), "role_name": r[1], "color": _hex(r[2]), "position": r[3]}
                    for r in roles
                ]
            }
    except Exception as e:
        logger.error("Error getting user roles for auth: %s", e)
        return {'roles': []}


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_jwt_token(user_data: dict, roles: List[Dict] = None) -> str:
    """Create a signed JWT for the authenticated user."""
    user_id = user_data['id']
    is_admin = (
        any(role.get('role_id', '') in ADMIN_ROLE_IDS for role in (roles or []))
        or user_id in ADMIN_USER_IDS
    )
    is_guest = user_id in GUEST_USER_IDS

    if is_admin or is_guest:
        has_website_access = True
    elif ALLOWED_ROLE_IDS:
        has_website_access = any(role.get('role_id', '') in ALLOWED_ROLE_IDS for role in (roles or []))
    else:
        has_website_access = bool(roles)

    payload = {
        'user_id': user_id,
        'username': user_data['username'],
        'discriminator': user_data['discriminator'],
        'avatar_url': (
            f"https://cdn.discordapp.com/avatars/{user_data['id']}/{user_data['avatar']}.png"
            if user_data.get('avatar')
            else None
        ),
        'roles': roles or [],
        'is_admin': is_admin,
        'is_guest': is_guest,
        'has_website_access': has_website_access,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> dict:
    """Verify and decode a JWT.  Raises 401 on any failure."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# ── FastAPI dependency functions ──────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthUser:
    """Decode the JWT and return the current user (no DB hit)."""
    payload = verify_jwt_token(credentials.credentials)
    return AuthUser(
        user_id=payload['user_id'],
        username=payload['username'],
        discriminator=payload['discriminator'],
        avatar_url=payload.get('avatar_url'),
        roles=payload.get('roles', []),
        is_admin=payload.get('is_admin', False),
        is_guest=payload.get('is_guest', False),
        has_website_access=payload.get('has_website_access', False),
    )


async def _live_roles(user_id: str) -> List[Dict]:
    """Re-fetch the user's current roles from the database."""
    if not REQUIRED_GUILD_ID:
        return []
    member = await get_user_guild_member_info("", REQUIRED_GUILD_ID, user_id)
    return member.get("roles", [])


def _compute_flags(user_id: str, roles: List[Dict]) -> tuple[bool, bool]:
    """Return (is_admin, has_website_access) based on live roles."""
    is_admin = user_id in ADMIN_USER_IDS or any(
        r.get("role_id", "") in ADMIN_ROLE_IDS for r in roles
    )
    if is_admin:
        return True, True
    if ALLOWED_ROLE_IDS:
        access = any(r.get("role_id", "") in ALLOWED_ROLE_IDS for r in roles)
    else:
        access = bool(roles)
    return False, access


async def require_website_access(
    current_user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    """Dependency: user must have website access.

    Always re-validates against the database so revoked roles and revoked guest status
    take effect immediately without waiting for token expiry.

    Fail-secure: if the DB is unavailable, access is DENIED (same as require_admin).
    """
    # Re-check guest status live against the canonical source (GUEST_USER_IDS in env).
    # Ensures removing a user from GUEST_USER_IDS revokes access immediately.
    is_live_guest = current_user.user_id in GUEST_USER_IDS

    if not REQUIRED_GUILD_ID:
        # No guild configured — trust JWT claim for roles, but re-check guest status live.
        if is_live_guest:
            return current_user
        if not current_user.has_website_access:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Website access required")
        return current_user

    try:
        fresh_roles = await _live_roles(current_user.user_id)
    except Exception as e:
        logger.warning("Could not refresh roles for access check (user %s): %s", current_user.user_id, e)
        # Fail CLOSED on DB error — do not grant access based on stale JWT claims.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Website access required")

    # Guest users always have access (re-validated live above)
    if is_live_guest:
        return AuthUser(
            user_id=current_user.user_id,
            username=current_user.username,
            discriminator=current_user.discriminator,
            avatar_url=current_user.avatar_url,
            roles=fresh_roles,
            is_admin=False,
            is_guest=True,
            has_website_access=True,
        )

    is_admin, has_access = _compute_flags(current_user.user_id, fresh_roles)
    if current_user.user_id in ADMIN_USER_IDS:
        is_admin, has_access = True, True

    if not has_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Website access required")

    return AuthUser(
        user_id=current_user.user_id,
        username=current_user.username,
        discriminator=current_user.discriminator,
        avatar_url=current_user.avatar_url,
        roles=fresh_roles,
        is_admin=is_admin,
        is_guest=False,
        has_website_access=True,
    )


async def require_admin(
    current_user: AuthUser = Depends(get_current_user),
) -> AuthUser:
    """Dependency: user must have admin privileges.
    Always re-validates against the database — JWT claim alone is not trusted.
    """
    if not REQUIRED_GUILD_ID:
        # No guild configured — fall back to JWT claim
        if not current_user.is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
        return current_user

    try:
        fresh_roles = await _live_roles(current_user.user_id)
    except Exception as e:
        logger.warning("Could not refresh roles for admin check (user %s): %s", current_user.user_id, e)
        # Fail secure: deny if we cannot verify current roles
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

    is_admin = current_user.user_id in ADMIN_USER_IDS or any(
        r.get("role_id", "") in ADMIN_ROLE_IDS for r in fresh_roles
    )
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

    return AuthUser(
        user_id=current_user.user_id,
        username=current_user.username,
        discriminator=current_user.discriminator,
        avatar_url=current_user.avatar_url,
        roles=fresh_roles,
        is_admin=True,
        is_guest=current_user.is_guest,
        has_website_access=True,
    )
