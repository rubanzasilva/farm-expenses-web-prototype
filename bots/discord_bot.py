"""Minimal Discord bot: forward messages to the farm-expenses ingest endpoint.

The bot listens in DMs (or a designated channel) and POSTs each message to
/api/ingest/discord with the shared INGEST_SECRET, then replies with the
confirmation the API returns.

Run this anywhere that can stay online (your laptop, a Pi, a free bot host).
It is intentionally separate from the web app so it doesn't depend on Render's
free-tier instance staying awake.

Env vars:
  DISCORD_BOT_TOKEN   - the bot token from discord.com/developers
  INGEST_URL          - e.g. https://farm.flexiblefunctions.com/api/ingest/discord
  INGEST_SECRET       - must match the app's INGEST_SECRET
  DISCORD_CHANNEL_ID  - (optional) restrict to one channel id; if unset, also
                        responds to DMs and any channel it can see

Install:  pip install discord.py requests
Run:      python bots/discord_bot.py
"""
import os
import sys

import requests

try:
    import discord
except ImportError:
    sys.exit("Install dependencies first:  pip install discord.py requests")

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
INGEST_URL = os.environ.get("INGEST_URL", "")
INGEST_SECRET = os.environ.get("INGEST_SECRET", "")
CHANNEL_ID = os.environ.get("DISCORD_CHANNEL_ID", "")  # optional

if not (TOKEN and INGEST_URL and INGEST_SECRET):
    sys.exit("Set DISCORD_BOT_TOKEN, INGEST_URL, and INGEST_SECRET environment variables.")

intents = discord.Intents.default()
intents.message_content = True  # needed to read message text — enable in the dev portal too
client = discord.Client(intents=intents)


@client.event
async def on_ready():
    print(f"Logged in as {client.user}. Listening for expense messages.")


@client.event
async def on_message(message: discord.Message):
    if message.author == client.user:
        return  # ignore our own messages
    if CHANNEL_ID and str(message.channel.id) != CHANNEL_ID:
        return  # restricted to one channel
    text = (message.content or "").strip()
    if not text:
        return

    try:
        resp = requests.post(
            INGEST_URL,
            json={"text": text, "source": "discord"},
            headers={"X-Ingest-Secret": INGEST_SECRET},
            timeout=30,
        )
        if resp.status_code == 200:
            await message.channel.send(resp.json().get("reply", "Logged."))
        else:
            detail = resp.json().get("detail", resp.text) if resp.content else resp.reason
            await message.channel.send(f"⚠️ Couldn't log that ({resp.status_code}): {detail}")
    except requests.RequestException as e:
        await message.channel.send(f"⚠️ Network error reaching the app: {e}")


if __name__ == "__main__":
    client.run(TOKEN)
