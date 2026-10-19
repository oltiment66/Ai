#!/bin/sh
set -eu
PUBLIC_PORT="${PORT:-8080}"
export PUBLIC_PORT
export BOT_PORT=8081
export PORT=8081
python bot/main.py &
BOT_PID=$!
trap 'kill "$BOT_PID" 2>/dev/null || true' EXIT INT TERM
sleep 1
exec python gateway.py
