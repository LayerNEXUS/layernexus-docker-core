#!/bin/sh
set -e

# Create an empty secrets.json on first run (prevents FileNotFoundError)
SECRETS_PATH=${SECRETS_PATH:-/app/backend/secrets.json}
mkdir -p "$(dirname "$SECRETS_PATH")"
[ -f "$SECRETS_PATH" ] || echo '{}' > "$SECRETS_PATH"

# Abort if DATABASE_URL is missing
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set. Pass -e DATABASE_URL=... when running the container."
  exit 1
fi

# Start FastAPI backend (port 8001) in background
/app/main.bin &

# Start Nginx in foreground
nginx -g 'daemon off;'
