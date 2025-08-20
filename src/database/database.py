import aiosqlite
import logging
from datetime import datetime, timedelta
from pathlib import Path
import discord
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

class Database:
    """Database handler for tracking user activities"""
    
    def __init__(self, db_path: str):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
    
    async def initialize(self):
        """Initialize the database and create tables"""
        async with aiosqlite.connect(self.db_path) as db:
            await self._create_tables(db)
            await self._migrate_database(db)
            await db.commit()
        logger.info("Database initialized successfully")
    
    async def _create_tables(self, db: aiosqlite.Connection):
        """Create all necessary tables"""
        
        # Users table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                discriminator TEXT,
                display_name TEXT,
                avatar_url TEXT,
                created_at TIMESTAMP,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_bot BOOLEAN DEFAULT FALSE
            )
        """)
        
        # Guild members table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS guild_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                joined_at TIMESTAMP,
                nickname TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                UNIQUE(guild_id, user_id)
            )
        """)
        
        # Username changes table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS username_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                old_username TEXT NOT NULL,
                new_username TEXT NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        # Nickname changes table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS nickname_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                old_nickname TEXT,
                new_nickname TEXT,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        # Roles table - stores all Discord roles
        await db.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                role_id INTEGER PRIMARY KEY,
                guild_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                color INTEGER NOT NULL DEFAULT 0,
                position INTEGER DEFAULT 0,
                permissions TEXT DEFAULT '0',
                is_hoisted BOOLEAN DEFAULT FALSE,
                is_mentionable BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Role changes table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS role_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                action TEXT NOT NULL, -- 'added', 'removed', or 'initial'
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                FOREIGN KEY (role_id) REFERENCES roles (role_id)
            )
        """)
        
        # Join/Leave events table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS join_leave_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                event_type TEXT NOT NULL, -- 'join' or 'leave'
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        # Create indexes for better performance
        await db.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members (guild_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_username_changes_user ON username_changes (user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_nickname_changes_user ON nickname_changes (user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_role_changes_user ON role_changes (user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_role_changes_role ON role_changes (role_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_roles_guild ON roles (guild_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_join_leave_events_guild ON join_leave_events (guild_id)")
    
    async def _migrate_database(self, db: aiosqlite.Connection):
        """Handle database migrations"""
        
        # Check if roles table exists
        cursor = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='roles'")
        roles_table_exists = await cursor.fetchone()
        
        if not roles_table_exists:
            logger.info("Creating roles table and migrating data...")
            
            # Create roles table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS roles (
                    role_id INTEGER PRIMARY KEY,
                    guild_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    color INTEGER NOT NULL DEFAULT 0,
                    position INTEGER DEFAULT 0,
                    permissions TEXT DEFAULT '0',
                    is_hoisted BOOLEAN DEFAULT FALSE,
                    is_mentionable BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Migrate existing role data from role_changes
            await db.execute("""
                INSERT OR IGNORE INTO roles (role_id, guild_id, name, color)
                SELECT DISTINCT role_id, guild_id, 
                       COALESCE(role_name, 'Unknown Role') as name,
                       COALESCE(role_color, 0) as color
                FROM role_changes 
                WHERE role_id IS NOT NULL AND role_name IS NOT NULL
            """)
            
            # Remove redundant columns from role_changes (they're now in roles table)
            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            await db.execute("""
                CREATE TABLE role_changes_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    guild_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    role_id INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id),
                    FOREIGN KEY (role_id) REFERENCES roles (role_id)
                )
            """)
            
            # Copy data from old table
            await db.execute("""
                INSERT INTO role_changes_new (id, guild_id, user_id, role_id, action, changed_at)
                SELECT id, guild_id, user_id, role_id, 
                       COALESCE(action, 'initial') as action, 
                       changed_at
                FROM role_changes
            """)
            
            # Replace old table
            await db.execute("DROP TABLE role_changes")
            await db.execute("ALTER TABLE role_changes_new RENAME TO role_changes")
            
            # Recreate indexes
            await db.execute("CREATE INDEX IF NOT EXISTS idx_role_changes_user ON role_changes (user_id)")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_role_changes_role ON role_changes (role_id)")
            await db.execute("CREATE INDEX IF NOT EXISTS idx_roles_guild ON roles (guild_id)")
            
            logger.info("Migration completed: roles table created and data migrated")
    
    async def upsert_role(self, role: discord.Role):
        """Insert or update role information"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO roles 
                (role_id, guild_id, name, color, position, permissions, is_hoisted, is_mentionable, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                role.id,
                role.guild.id,
                role.name,
                role.color.value,
                role.position,
                str(role.permissions.value),
                role.hoist,
                role.mentionable
            ))
            await db.commit()

    async def upsert_user(self, user: discord.User | discord.Member):
        """Insert or update user information"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO users 
                (user_id, username, discriminator, display_name, avatar_url, created_at, last_seen, is_bot)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user.id,
                user.name,
                user.discriminator if hasattr(user, 'discriminator') else None,
                user.display_name,
                str(user.display_avatar.url) if user.display_avatar else None,
                user.created_at,
                datetime.utcnow(),
                user.bot
            ))
            await db.commit()
    
    async def upsert_guild_member(self, member: discord.Member):
        """Insert or update guild member information"""
        await self.upsert_user(member)
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT OR REPLACE INTO guild_members 
                (guild_id, user_id, joined_at, nickname, is_active)
                VALUES (?, ?, ?, ?, ?)
            """, (
                member.guild.id,
                member.id,
                member.joined_at,
                member.nick,
                True
            ))
            await db.commit()
    
    async def log_username_change(self, before: discord.User, after: discord.User):
        """Log a username change"""
        await self.upsert_user(after)
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO username_changes (user_id, old_username, new_username)
                VALUES (?, ?, ?)
            """, (after.id, before.name, after.name))
            await db.commit()
    
    async def log_nickname_change(self, before: discord.Member, after: discord.Member):
        """Log a nickname change"""
        await self.upsert_guild_member(after)
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO nickname_changes (guild_id, user_id, old_nickname, new_nickname)
                VALUES (?, ?, ?, ?)
            """, (after.guild.id, after.id, before.nick, after.nick))
            await db.commit()
    
    async def log_role_change(self, before: discord.Member, after: discord.Member):
        """Log role changes"""
        await self.upsert_guild_member(after)
        
        before_roles = set(role.id for role in before.roles)
        after_roles = set(role.id for role in after.roles)
        
        added_roles = after_roles - before_roles
        removed_roles = before_roles - after_roles
        
        # Ensure roles exist in roles table first
        for role_id in added_roles | removed_roles:
            role = after.guild.get_role(role_id) or before.guild.get_role(role_id)
            if role:
                await self.upsert_role(role)
        
        async with aiosqlite.connect(self.db_path) as db:
            # Log added roles
            for role_id in added_roles:
                await db.execute("""
                    INSERT INTO role_changes (guild_id, user_id, role_id, action)
                    VALUES (?, ?, ?, ?)
                """, (after.guild.id, after.id, role_id, 'added'))
            
            # Log removed roles
            for role_id in removed_roles:
                await db.execute("""
                    INSERT INTO role_changes (guild_id, user_id, role_id, action)
                    VALUES (?, ?, ?, ?)
                """, (after.guild.id, after.id, role_id, 'removed'))
            
            await db.commit()
    
    async def log_user_join(self, member: discord.Member):
        """Log when a user joins the guild"""
        await self.upsert_guild_member(member)
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO join_leave_events (guild_id, user_id, event_type)
                VALUES (?, ?, ?)
            """, (member.guild.id, member.id, 'join'))
            await db.commit()
    
    async def log_user_leave(self, member: discord.Member):
        """Log when a user leaves the guild"""
        async with aiosqlite.connect(self.db_path) as db:
            # Mark as inactive in guild_members
            await db.execute("""
                UPDATE guild_members 
                SET is_active = FALSE 
                WHERE guild_id = ? AND user_id = ?
            """, (member.guild.id, member.id))
            
            # Log leave event
            await db.execute("""
                INSERT INTO join_leave_events (guild_id, user_id, event_type)
                VALUES (?, ?, ?)
            """, (member.guild.id, member.id, 'leave'))
            
            await db.commit()
    
    async def get_user_stats(self, user_id) -> Dict[str, Any]:
        """Get statistics for a specific user"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get basic user info
            cursor = await db.execute("""
                SELECT * FROM users WHERE user_id = ?
            """, (user_id,))
            user_data = await cursor.fetchone()
            
            if not user_data:
                return {}
            
            # Get change counts (excluding initial role assignments)
            cursor = await db.execute("""
                SELECT 
                    (SELECT COUNT(*) FROM username_changes WHERE user_id = ?) as username_changes,
                    (SELECT COUNT(*) FROM nickname_changes WHERE user_id = ?) as nickname_changes,
                    (SELECT COUNT(*) FROM role_changes WHERE user_id = ? AND action != 'initial') as role_changes
            """, (user_id, user_id, user_id))
            
            stats = await cursor.fetchone()
            
            return {
                'username_changes': stats[0] if stats else 0,
                'nickname_changes': stats[1] if stats else 0,
                'role_changes': stats[2] if stats else 0,
                'last_activity': datetime.fromisoformat(user_data[7]) if user_data[7] else None
            }
    
    async def get_server_stats(self, guild_id: int) -> Dict[str, Any]:
        """Get statistics for a specific server"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get total counts (excluding initial role assignments)
            cursor = await db.execute("""
                SELECT 
                    (SELECT COUNT(DISTINCT user_id) FROM guild_members WHERE guild_id = ?) as total_users,
                    (SELECT COUNT(*) FROM username_changes uc 
                     JOIN guild_members gm ON uc.user_id = gm.user_id 
                     WHERE gm.guild_id = ?) as total_username_changes,
                    (SELECT COUNT(*) FROM nickname_changes WHERE guild_id = ?) as total_nickname_changes,
                    (SELECT COUNT(*) FROM role_changes WHERE guild_id = ? AND action != 'initial') as total_role_changes
            """, (guild_id, guild_id, guild_id, guild_id))
            
            stats = await cursor.fetchone()
            
            # Get 24h activity
            yesterday = datetime.utcnow() - timedelta(days=1)
            cursor = await db.execute("""
                SELECT 
                    (SELECT COUNT(*) FROM join_leave_events 
                     WHERE guild_id = ? AND event_type = 'join' AND timestamp > ?) as new_members_24h,
                    (SELECT COUNT(*) FROM join_leave_events 
                     WHERE guild_id = ? AND event_type = 'leave' AND timestamp > ?) as left_members_24h,
                    (SELECT COUNT(*) FROM nickname_changes 
                     WHERE guild_id = ? AND changed_at > ?) as name_changes_24h
            """, (guild_id, yesterday, guild_id, yesterday, guild_id, yesterday))
            
            activity_stats = await cursor.fetchone()
            
            return {
                'total_users': stats[0] if stats else 0,
                'total_username_changes': stats[1] if stats else 0,
                'total_nickname_changes': stats[2] if stats else 0,
                'total_role_changes': stats[3] if stats else 0,
                'new_members_24h': activity_stats[0] if activity_stats else 0,
                'left_members_24h': activity_stats[1] if activity_stats else 0,
                'name_changes_24h': activity_stats[2] if activity_stats else 0
            }
    
    async def get_recent_changes(self, guild_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent username, nickname, and role changes (excluding initial roles)"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT 'username' as type, uc.user_id, old_username as old_value, 
                       new_username as new_value, changed_at as timestamp, 
                       NULL as role_id, NULL as role_name, NULL as role_color, NULL as action,
                       u.username, u.display_name, u.avatar_url
                FROM username_changes uc
                JOIN guild_members gm ON uc.user_id = gm.user_id
                JOIN users u ON uc.user_id = u.user_id
                WHERE gm.guild_id = ?
                
                UNION ALL
                
                SELECT 'nickname' as type, nc.user_id, old_nickname as old_value,
                       new_nickname as new_value, changed_at as timestamp,
                       NULL as role_id, NULL as role_name, NULL as role_color, NULL as action,
                       u.username, u.display_name, u.avatar_url
                FROM nickname_changes nc
                JOIN users u ON nc.user_id = u.user_id
                WHERE nc.guild_id = ?
                
                UNION ALL
                
                SELECT 'role' as type, rc.user_id, 
                       CASE WHEN rc.action = 'removed' THEN r.name ELSE NULL END as old_value,
                       CASE WHEN rc.action = 'added' THEN r.name ELSE NULL END as new_value,
                       rc.changed_at as timestamp,
                       r.role_id, r.name as role_name, r.color as role_color, rc.action,
                       u.username, u.display_name, u.avatar_url
                FROM role_changes rc
                JOIN roles r ON rc.role_id = r.role_id
                JOIN users u ON rc.user_id = u.user_id
                WHERE rc.guild_id = ? AND rc.action != 'initial'
                
                ORDER BY timestamp DESC
                LIMIT ?
            """, (guild_id, guild_id, guild_id, limit))
            
            rows = await cursor.fetchall()
            
            changes = []
            for row in rows:
                change_data = {
                    'type': row[0],
                    'user_id': row[1],
                    'old_value': row[2],
                    'new_value': row[3],
                    'timestamp': datetime.fromisoformat(row[4]),
                    'username': row[9],
                    'display_name': row[10],
                    'avatar_url': row[11]
                }
                
                # Add role-specific data if this is a role change
                if row[0] == 'role':
                    change_data.update({
                        'role_id': row[5],
                        'role_name': row[6],
                        'role_color': row[7],
                        'action': row[8]
                    })
                
                changes.append(change_data)
            
            return changes
    
    async def get_role_history(self, user_id, guild_id: int) -> List[Dict[str, Any]]:
        """Get role change history for a user (excluding initial role assignments)"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT rc.role_id, r.name as role_name, r.color, rc.action, rc.changed_at
                FROM role_changes rc
                INNER JOIN roles r ON rc.role_id = r.role_id
                WHERE rc.user_id = ? AND rc.guild_id = ? AND rc.action != 'initial'
                ORDER BY rc.changed_at DESC
            """, (user_id, guild_id))
            
            rows = await cursor.fetchall()
            
            history = []
            for row in rows:
                history.append({
                    'role_id': row[0],
                    'role_name': row[1],
                    'role_color': row[2],
                    'action': row[3],
                    'timestamp': datetime.fromisoformat(row[4])
                })
            
            return history
    
    async def get_weekly_activity(self, guild_id: int) -> List[Dict[str, Any]]:
        """Get activity statistics for the last 7 days"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get the start of the week (7 days ago)
            week_ago = datetime.utcnow() - timedelta(days=7)
            
            cursor = await db.execute("""
                WITH weekly_changes AS (
                    -- Username changes
                    SELECT 
                        CASE CAST(STRFTIME('%w', uc.changed_at) AS INTEGER)
                            WHEN 0 THEN 'Sun'
                            WHEN 1 THEN 'Mon' 
                            WHEN 2 THEN 'Tue'
                            WHEN 3 THEN 'Wed'
                            WHEN 4 THEN 'Thu'
                            WHEN 5 THEN 'Fri'
                            WHEN 6 THEN 'Sat'
                        END as day_name,
                        CAST(STRFTIME('%w', uc.changed_at) AS INTEGER) as day_number,
                        COUNT(*) as change_count
                    FROM username_changes uc
                    JOIN guild_members gm ON uc.user_id = gm.user_id
                    WHERE gm.guild_id = ? AND uc.changed_at >= ?
                    GROUP BY STRFTIME('%w', uc.changed_at)
                    
                    UNION ALL
                    
                    -- Nickname changes  
                    SELECT 
                        CASE CAST(STRFTIME('%w', nc.changed_at) AS INTEGER)
                            WHEN 0 THEN 'Sun'
                            WHEN 1 THEN 'Mon'
                            WHEN 2 THEN 'Tue' 
                            WHEN 3 THEN 'Wed'
                            WHEN 4 THEN 'Thu'
                            WHEN 5 THEN 'Fri'
                            WHEN 6 THEN 'Sat'
                        END as day_name,
                        CAST(STRFTIME('%w', nc.changed_at) AS INTEGER) as day_number,
                        COUNT(*) as change_count
                    FROM nickname_changes nc
                    WHERE nc.guild_id = ? AND nc.changed_at >= ?
                    GROUP BY STRFTIME('%w', nc.changed_at)
                    
                    UNION ALL
                    
                    -- Role changes (excluding initial)
                    SELECT 
                        CASE CAST(STRFTIME('%w', rc.changed_at) AS INTEGER)
                            WHEN 0 THEN 'Sun'
                            WHEN 1 THEN 'Mon'
                            WHEN 2 THEN 'Tue'
                            WHEN 3 THEN 'Wed' 
                            WHEN 4 THEN 'Thu'
                            WHEN 5 THEN 'Fri'
                            WHEN 6 THEN 'Sat'
                        END as day_name,
                        CAST(STRFTIME('%w', rc.changed_at) AS INTEGER) as day_number,
                        COUNT(*) as change_count
                    FROM role_changes rc
                    WHERE rc.guild_id = ? AND rc.changed_at >= ? AND rc.action != 'initial'
                    GROUP BY STRFTIME('%w', rc.changed_at)
                )
                SELECT day_name, SUM(change_count) as total_changes
                FROM weekly_changes
                GROUP BY day_name, day_number
                ORDER BY day_number
            """, (guild_id, week_ago, guild_id, week_ago, guild_id, week_ago))
            
            rows = await cursor.fetchall()
            
            # Create a complete week structure with all days
            days_order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            activity_data = []
            
            # Convert rows to dict for easy lookup
            data_dict = {row[0]: row[1] for row in rows}
            
            # Ensure all days are present, even with 0 changes
            for day in days_order:
                activity_data.append({
                    'name': day,
                    'changes': data_dict.get(day, 0)
                })
            
            return activity_data
    
    async def get_database_stats(self) -> Dict[str, int]:
        """Get overall database statistics (excluding initial role assignments)"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT 
                    (SELECT COUNT(*) FROM users) as user_count,
                    (SELECT COUNT(*) FROM username_changes) as username_changes,
                    (SELECT COUNT(*) FROM nickname_changes) as nickname_changes,
                    (SELECT COUNT(*) FROM role_changes WHERE action != 'initial') as role_changes,
                    (SELECT COUNT(*) FROM join_leave_events) as join_leave_events
            """)
            
            stats = await cursor.fetchone()
            
            return {
                'user_count': stats[0] if stats else 0,
                'username_changes': stats[1] if stats else 0,
                'nickname_changes': stats[2] if stats else 0,
                'role_changes': stats[3] if stats else 0,
                'join_leave_events': stats[4] if stats else 0
            }
    
    async def cleanup_old_data(self, days: int) -> int:
        """Clean up old tracking data"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        async with aiosqlite.connect(self.db_path) as db:
            # Delete old username changes
            cursor = await db.execute("""
                DELETE FROM username_changes WHERE changed_at < ?
            """, (cutoff_date,))
            
            deleted_count = cursor.rowcount
            
            # Delete old nickname changes
            cursor = await db.execute("""
                DELETE FROM nickname_changes WHERE changed_at < ?
            """, (cutoff_date,))
            
            deleted_count += cursor.rowcount
            
            # Delete old role changes
            cursor = await db.execute("""
                DELETE FROM role_changes WHERE changed_at < ?
            """, (cutoff_date,))
            
            deleted_count += cursor.rowcount
            
            # Delete old join/leave events
            cursor = await db.execute("""
                DELETE FROM join_leave_events WHERE timestamp < ?
            """, (cutoff_date,))
            
            deleted_count += cursor.rowcount
            
            await db.commit()
            
            return deleted_count
    
    async def export_user_data(self, user_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Export all data for a specific user"""
        async with aiosqlite.connect(self.db_path) as db:
            data = {}
            
            # Username changes
            cursor = await db.execute("""
                SELECT old_username, new_username, changed_at
                FROM username_changes WHERE user_id = ?
                ORDER BY changed_at
            """, (user_id,))
            
            data['username_changes'] = [
                {
                    'old_username': row[0],
                    'new_username': row[1],
                    'changed_at': row[2]
                }
                for row in await cursor.fetchall()
            ]
            
            # Nickname changes
            cursor = await db.execute("""
                SELECT guild_id, old_nickname, new_nickname, changed_at
                FROM nickname_changes WHERE user_id = ?
                ORDER BY changed_at
            """, (user_id,))
            
            data['nickname_changes'] = [
                {
                    'guild_id': row[0],
                    'old_nickname': row[1],
                    'new_nickname': row[2],
                    'changed_at': row[3]
                }
                for row in await cursor.fetchall()
            ]
            
            # Role changes
            cursor = await db.execute("""
                SELECT guild_id, role_id, role_name, action, changed_at
                FROM role_changes WHERE user_id = ?
                ORDER BY changed_at
            """, (user_id,))
            
            data['role_changes'] = [
                {
                    'guild_id': row[0],
                    'role_id': row[1],
                    'role_name': row[2],
                    'action': row[3],
                    'changed_at': row[4]
                }
                for row in await cursor.fetchall()
            ]
            
            # Join/leave events
            cursor = await db.execute("""
                SELECT guild_id, event_type, timestamp
                FROM join_leave_events WHERE user_id = ?
                ORDER BY timestamp
            """, (user_id,))
            
            data['join_leave_events'] = [
                {
                    'guild_id': row[0],
                    'event_type': row[1],
                    'timestamp': row[2]
                }
                for row in await cursor.fetchall()
            ]
            
            return data
    
    async def _log_initial_role(self, member: discord.Member, role: discord.Role):
        """Log initial role during inventory (only if no role history exists for this specific role)"""
        # First ensure the role exists in the roles table
        await self.upsert_role(role)
        
        async with aiosqlite.connect(self.db_path) as db:
            # Check if this user already has THIS SPECIFIC role in history
            cursor = await db.execute("""
                SELECT COUNT(*) FROM role_changes 
                WHERE user_id = ? AND guild_id = ? AND role_id = ?
            """, (member.id, member.guild.id, role.id))
            
            role_specific_count = (await cursor.fetchone())[0]
            
            # Only log initial role if this specific role hasn't been tracked before
            if role_specific_count == 0:
                # This is the first time we're tracking this specific role for this user
                await db.execute("""
                    INSERT INTO role_changes (guild_id, user_id, role_id, action, changed_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    member.guild.id, 
                    member.id, 
                    role.id, 
                    'initial', 
                    datetime.utcnow()
                ))
                await db.commit()
                logger.debug(f"Logged initial role {role.name} for user {member.display_name}")
            else:
                # This specific role already exists in history, skip
                logger.debug(f"Skipping initial role logging for {member.display_name} - role {role.name} already tracked")
    
    async def cleanup_duplicate_initial_roles(self):
        """Clean up duplicate 'initial' role entries, keeping only the oldest one per user/role combination"""
        async with aiosqlite.connect(self.db_path) as db:
            logger.info("Starting cleanup of duplicate initial role entries...")
            
            # Find duplicate initial entries (same user, guild, role with action='initial')
            cursor = await db.execute("""
                SELECT user_id, guild_id, role_id, COUNT(*) as count
                FROM role_changes 
                WHERE action = 'initial'
                GROUP BY user_id, guild_id, role_id
                HAVING COUNT(*) > 1
                ORDER BY user_id, guild_id, role_id
            """)
            
            duplicates = await cursor.fetchall()
            
            if not duplicates:
                logger.info("No duplicate initial role entries found.")
                return
            
            logger.info(f"Found {len(duplicates)} duplicate initial role combinations to clean up")
            
            total_deleted = 0
            for user_id, guild_id, role_id, count in duplicates:
                # Keep only the oldest initial entry for each user/guild/role combination
                cursor = await db.execute("""
                    DELETE FROM role_changes 
                    WHERE user_id = ? AND guild_id = ? AND role_id = ? AND action = 'initial'
                    AND id NOT IN (
                        SELECT id FROM role_changes 
                        WHERE user_id = ? AND guild_id = ? AND role_id = ? AND action = 'initial'
                        ORDER BY changed_at ASC 
                        LIMIT 1
                    )
                """, (user_id, guild_id, role_id, user_id, guild_id, role_id))
                
                deleted_count = cursor.rowcount
                total_deleted += deleted_count
                
                logger.debug(f"Deleted {deleted_count} duplicate initial entries for user {user_id}, role {role_id}")
            
            await db.commit()
            logger.info(f"Cleanup completed: Removed {total_deleted} duplicate initial role entries")
    
    async def close(self):
        """Close database connections"""
        # aiosqlite handles connection closing automatically
        pass
