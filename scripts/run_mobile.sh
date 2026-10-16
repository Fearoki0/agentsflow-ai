#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   STARTING AGENTSFLOW UNIVERSAL AI CHATBOT (MOBILE)     "
echo "==========================================================\n"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHATBOT_DIR="$PROJECT_ROOT/chatbot"

cd "$CHATBOT_DIR"

# Ensure public uploads directory exists for offline storage
mkdir -p "$CHATBOT_DIR/public/uploads"

# Check if local-data.json exists, if not initialize it
if [ ! -f "$CHATBOT_DIR/public/local-data.json" ]; then
  echo '{"users":{},"chats":{},"messages":{},"votes":{},"documents":{},"suggestions":{}}' > "$CHATBOT_DIR/public/local-data.json"
fi

# Set mobile-optimized environment variables
export NEXT_TELEMETRY_DISABLED=1
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=1
export NODE_OPTIONS="--max-old-space-size=2048"
export PORT=${PORT:-3000}
export HOSTNAME=${HOSTNAME:-"0.0.0.0"}

echo "✓ Local database initialized at public/local-data.json"
echo "✓ Multi-modal local uploads ready at public/uploads/"
echo "✓ Starting Next.js mobile server on http://localhost:${PORT}..."
echo "✓ (Accessible on local network via http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost"):${PORT})"
echo ""

# Run next dev with --webpack for Android Termux Bionic libc compatibility
node node_modules/next/dist/bin/next dev --webpack -H "$HOSTNAME" -p "$PORT"
