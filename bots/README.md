# Discord → expense bot

Send a freeform message in Discord ("paid 20k for gumboots"), and it's parsed
and logged as an expense in the farm app.

## How it works

```
You (Discord) → discord_bot.py → POST /api/ingest/discord (shared secret)
                                   → parse (Claude Haiku via Bedrock, or
                                     keyword fallback) → create Expense → reply
```

The bot is a small separate process so it doesn't depend on Render's free-tier
instance staying awake. Run it on your laptop, a Raspberry Pi, or any always-on
host.

## 1. App side (Render env vars)

Set these on the Render web service (Settings → Environment):

| Key | Value |
|-----|-------|
| `INGEST_SECRET` | a long random string (generate with `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`) |
| `AWS_ACCESS_KEY_ID` | your AWS key (for Bedrock parsing) |
| `AWS_SECRET_ACCESS_KEY` | your AWS secret |
| `AWS_REGION` | e.g. `us-east-1` — a region where you've enabled Claude Haiku |

**Bedrock model access:** in the AWS console → Bedrock → *Model access* → enable
**Claude Haiku** in that region (one-time). Without it, the app still works — it
falls back to keyword parsing — but you won't get the smart categorization.

If `INGEST_SECRET` is unset, the ingest endpoint returns 503 (disabled).

## 2. Create the Discord bot

1. Go to <https://discord.com/developers/applications> → **New Application**.
2. **Bot** tab → **Add Bot** → copy the **Token**.
3. Under **Privileged Gateway Intents**, enable **MESSAGE CONTENT INTENT**.
4. **OAuth2 → URL Generator**: scope `bot`, permissions *Send Messages* +
   *Read Message History*. Open the generated URL to invite the bot to your
   server. (Or just DM the bot.)

## 3. Run the bot

```bash
pip install discord.py requests

export DISCORD_BOT_TOKEN="your-bot-token"
export INGEST_URL="https://farm.flexiblefunctions.com/api/ingest/discord"
export INGEST_SECRET="same-secret-as-on-render"
# optional: restrict to one channel
# export DISCORD_CHANNEL_ID="123456789012345678"

python bots/discord_bot.py
```

Then in Discord, type things like:

- `gumboots 20000`
- `paid 20k for transport to kisongi`
- `100 banana suckers 80000`
- `agronomist consultancy fee 100k`

The bot replies with a confirmation like
`✅ Logged: *Transport* — transport to kisongi = UGX 20,000 (#42)`.

## Notes

- Amounts accept `k`/`m` shorthand (`20k` = 20000, `1.5m` = 1500000).
- Expenses created this way get `notes = "via discord"` so you can spot them.
- The fallback parser picks the **largest** number as the amount and uses the
  existing keyword classifier for the category. Bedrock handles messy input,
  dates, and ambiguous categories far better.
- Telegram works the same way — point a Telegram bot at the same endpoint.
