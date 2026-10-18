# AI FREE Connected Mini App + Bot

## Deploy on Railway
- Create one service from `bot`. Variables: `BOT_TOKEN`, `ADMIN_IDS`, `DB_PATH=/data/bot.db`, `MINI_APP_URL=https://YOUR-MINI-APP-DOMAIN`.
- Create a second service from `mini-app`. Variable: `API_URL=https://YOUR-BOT-DOMAIN`.
- Attach a Railway volume to the bot at `/data`.
- Open the bot and tap `🚀 باز کردن Mini App`.

The bot now owns the live API and provider keys. The Mini App authenticates through Telegram signed init data, loads live models/providers, and sends real chat messages through `/api/chat`. Do not put provider keys in the Mini App.
