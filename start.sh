#!/bin/sh
set -eu
public_port="${PORT:-8080}"
export PORT=8081
python bot/main.py &
bot_pid=$!
trap 'kill "$bot_pid" 2>/dev/null || true' EXIT INT TERM
PORT="$public_port" exec python gateway.py
