import os
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

# Cache für verwendete Authorization Codes  
used_codes = set()
code_lock = asyncio.Lock()

async def clear_expired_codes():
    """Clear expired codes periodically"""
    while True:
        await asyncio.sleep(300)  # Clear every 5 minutes
        async with code_lock:
            used_codes.clear()
            logger.info("Cleared expired authorization codes cache")

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID = os.getenv('DISCORD_CLIENT_ID')
DISCORD_CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET')
DISCORD_REDIRECT_URI = os.getenv('DISCORD_REDIRECT_URI', 'http://localhost:3001/auth/callback')

# Guild configuration
REQUIRED_GUILD_ID = os.getenv('DISCORD_GUILD_ID')

# Admin configuration
ADMIN_ROLE_IDS = [role_id.strip() for role_id in os.getenv('ADMIN_ROLE_IDS', '').split(',') if role_id.strip()]
ADMIN_USER_IDS = [user_id.strip() for user_id in os.getenv('ADMIN_USER_IDS', '').split(',') if user_id.strip()]

# Guest configuration
GUEST_USER_IDS = [user_id.strip() for user_id in os.getenv('GUEST_USER_IDS', '').split(',') if user_id.strip()]

security = HTTPBearer()

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
    state: Optional[str]

async def exchange_discord_code(code: str) -> dict:
    """Exchange Discord OAuth2 code for access token"""
    
    # Prevent code reuse with lock
    async with code_lock:
        if code in used_codes:
            logger.warning(f"Attempted reuse of authorization code: {code[:10]}...")
            raise HTTPException(
                status_code=400,
                detail="Authorization code has already been used"
            )
        used_codes.add(code)
    
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Discord OAuth2 not configured"
        )
    
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_response = await client.post(
            'https://discord.com/api/oauth2/token',
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'client_id': DISCORD_CLIENT_ID,
                'client_secret': DISCORD_CLIENT_SECRET,
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': DISCORD_REDIRECT_URI,
            }
        )
        
        if token_response.status_code != 200:
            logger.error(f"Discord token exchange failed: {token_response.text}")
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange Discord code"
            )
        
        token_data = token_response.json()
        access_token = token_data['access_token']
        
        # Get user info
        user_response = await client.get(
            'https://discord.com/api/users/@me',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Failed to get user info from Discord"
            )
        
        user_data = user_response.json()
        
        # Get user guilds
        guilds_response = await client.get(
            'https://discord.com/api/users/@me/guilds',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if guilds_response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Failed to get user guilds from Discord"
            )
        
        guilds_data = guilds_response.json()
        
        # Check if user is in required guild (but allow admin/guest users to bypass this)
        if REQUIRED_GUILD_ID:
            user_in_guild = any(guild['id'] == REQUIRED_GUILD_ID for guild in guilds_data)
            user_id = user_data['id']
            is_admin_user = user_id in ADMIN_USER_IDS
            is_guest_user = user_id in GUEST_USER_IDS
            
            if not user_in_guild and not (is_admin_user or is_guest_user):
                raise HTTPException(
                    status_code=403,
                    detail="You must be a member of the required Discord server"
                )
        
        return {
            'user': user_data,
            'guilds': guilds_data,
            'access_token': access_token
        }

async def get_user_guild_member_info(access_token: str, guild_id: str, user_id: str) -> dict:
    """Get user's member info for a specific guild"""
    # Get user roles from our database using the same logic as the API
    import aiosqlite
    from .main import db
    
    try:
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
            """, (int(user_id), int(guild_id)))
            
            roles = await cursor.fetchall()
            
            def int_to_hex_color(color_int):
                """Convert Discord color integer to hex string"""
                if color_int is None or color_int == 0:
                    return "#99aab5"  # Discord default role color
                return f"#{color_int:06x}"
            
            user_roles = [
                {
                    "role_id": str(role[0]),
                    "role_name": role[1],
                    "color": int_to_hex_color(role[2]),
                    "position": role[3]
                }
                for role in roles
            ]
            
            return {
                'roles': user_roles
            }
            
    except Exception as e:
        logger.error(f"Error getting user roles for auth: {e}")
        return {
            'roles': []
        }

def create_jwt_token(user_data: dict, roles: List[Dict] = None) -> str:
    """Create JWT token for authenticated user"""
    user_id = user_data['id']
    
    # Check if user is admin
    is_admin = (
        any(role.get('role_id', '') in ADMIN_ROLE_IDS for role in (roles or [])) or
        user_id in ADMIN_USER_IDS
    )
    
    # Check if user is guest
    is_guest = user_id in GUEST_USER_IDS
    
    # Calculate website access
    # Admin and Guest users always have access
    # Regular users need to have allowed roles
    has_website_access = False
    if is_admin or is_guest:
        has_website_access = True
    else:
        # Check if user has any of the allowed roles
        allowed_role_ids = [role_id.strip() for role_id in os.getenv('ALLOWED_ROLE_IDS', '').split(',') if role_id.strip()]
        if allowed_role_ids:
            has_website_access = any(role.get('role_id', '') in allowed_role_ids for role in (roles or []))
        else:
            # If no allowed roles configured, allow all users with roles
            has_website_access = bool(roles)
    
    payload = {
        'user_id': user_id,
        'username': user_data['username'],
        'discriminator': user_data['discriminator'],
        'avatar_url': f"https://cdn.discordapp.com/avatars/{user_data['id']}/{user_data['avatar']}.png" if user_data['avatar'] else None,
        'roles': roles or [],
        'is_admin': is_admin,
        'is_guest': is_guest,
        'has_website_access': has_website_access,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthUser:
    """Get current authenticated user from JWT token"""
    payload = verify_jwt_token(credentials.credentials)
    
    return AuthUser(
        user_id=payload['user_id'],
        username=payload['username'],
        discriminator=payload['discriminator'],
        avatar_url=payload.get('avatar_url'),
        roles=payload.get('roles', []),
        is_admin=payload.get('is_admin', False),
        is_guest=payload.get('is_guest', False),
        has_website_access=payload.get('has_website_access', False)
    )

async def require_admin(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    """Require admin privileges"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user
