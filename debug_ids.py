#!/usr/bin/env python3
"""
Debug script to check user ID precision issues
"""
import sqlite3
import asyncio
import discord
import os
from dotenv import load_dotenv

load_dotenv()

async def check_user_ids():
    """Check if user IDs in database match Discord reality"""
    
    # Connect to Discord
    token = os.getenv('DISCORD_TOKEN')
    guild_id = int(os.getenv('DISCORD_GUILD_ID'))
    
    intents = discord.Intents.default()
    intents.members = True
    
    client = discord.Client(intents=intents)
    
    @client.event
    async def on_ready():
        print(f"Connected as {client.user}")
        
        guild = client.get_guild(guild_id)
        if not guild:
            print(f"Guild {guild_id} not found!")
            await client.close()
            return
        
        print(f"Guild: {guild.name}")
        
        # Connect to database
        conn = sqlite3.connect('./data/tracking.db')
        cursor = conn.cursor()
        
        # Get stored user IDs
        cursor.execute("SELECT user_id, username FROM users LIMIT 10")
        stored_users = cursor.fetchall()
        
        print("\n=== STORED USER IDs ===")
        for user_id, username in stored_users:
            print(f"DB: {user_id} ({username})")
            
            # Try to find real user
            real_user = guild.get_member(user_id)
            if real_user:
                print(f"REAL: {real_user.id} ({real_user.name}) - MATCH: {user_id == real_user.id}")
            else:
                print(f"REAL: NOT FOUND")
            print()
        
        # Get some real Discord user IDs for comparison
        print("\n=== REAL DISCORD USER IDs ===")
        for member in list(guild.members)[:5]:
            print(f"Discord ID: {member.id} ({member.name})")
            
            # Check if stored in DB
            cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (member.id,))
            stored = cursor.fetchone()
            print(f"In DB: {stored[0] if stored else 'NOT FOUND'}")
            print()
        
        conn.close()
        await client.close()
    
    await client.start(token)

if __name__ == "__main__":
    asyncio.run(check_user_ids())
