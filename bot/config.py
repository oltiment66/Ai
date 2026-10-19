import os

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip().lstrip("-").isdigit()}
DB_PATH = os.getenv("DB_PATH") or ("/data/bot.db" if os.path.isdir("/data") else "bot.db")
API_PORT = int(os.getenv("PORT", os.getenv("API_PORT", "8080")))
MINI_APP_URL = os.getenv("MINI_APP_URL", "").strip() or (f"https://{os.getenv("RAILWAY_PUBLIC_DOMAIN", "")}" if os.getenv("RAILWAY_PUBLIC_DOMAIN") else "")
