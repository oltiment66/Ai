# AI FREE Mini App, connected mode

This is the Telegram Mini App frontend. It is designed to run as a separate Railway service from the Python bot.

## Railway setup
1. Deploy the `mini-app` folder as a Node service. It starts with `node server.js`.
2. Set `API_URL` to the public HTTPS URL of the bot service, for example `https://your-bot.up.railway.app`.
3. Deploy the `bot` folder as the Python service. Set `BOT_TOKEN`, `ADMIN_IDS`, `DB_PATH=/data/bot.db`, and `MINI_APP_URL=https://your-mini-app.up.railway.app`.
4. Open the bot and tap **🚀 باز کردن Mini App**. Telegram supplies the signed user identity automatically.

The Mini App now reads live models/providers from the bot, and its chat sends messages through the bot's provider keys. Keys never enter browser code. The bot's API listens on Railway's `PORT` and exposes authenticated `/api/bootstrap`, `/api/state`, and `/api/chat` endpoints.
