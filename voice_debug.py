"""
Voice connection debug script.
Run inside the container: docker exec requiem-bot python voice_debug.py
"""
import asyncio
import logging
import os
from dotenv import load_dotenv
import discord

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s:%(levelname)s:%(name)s: %(message)s'
)

CHANNEL_ID = 1484995106875375787

intents = discord.Intents.default()
intents.voice_states = True
intents.members = True

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'\n=== Bot ready: {client.user} ===\n')

    guild_id = int(os.getenv('DISCORD_GUILD_ID'))
    guild = client.get_guild(guild_id)
    channel = guild.get_channel(CHANNEL_ID)

    print(f'Target channel: {channel.name} ({channel.id})')
    print(f'Bot permissions in channel: connect={channel.permissions_for(guild.me).connect}, speak={channel.permissions_for(guild.me).speak}')
    print('Attempting voice connect (timeout=60s)...\n')

    try:
        vc = await asyncio.wait_for(
            channel.connect(timeout=60.0, reconnect=True),
            timeout=65.0
        )
        print('\n=== SUCCESS: Connected to voice channel! ===')
        await asyncio.sleep(2)
        await vc.disconnect()
        print('=== Disconnected cleanly ===')
    except asyncio.TimeoutError:
        print('\n=== TIMEOUT after 65s ===')
    except Exception as e:
        import traceback
        print(f'\n=== ERROR: {type(e).__name__}: {e} ===')
        traceback.print_exc()

    await client.close()

client.run(os.getenv('DISCORD_TOKEN'))
