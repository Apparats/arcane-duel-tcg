#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/arcane-duel-tcg}"
SERVICE_NAME="${SERVICE_NAME:-arcane-duel}"
RELEASE_ARCHIVE="${RELEASE_ARCHIVE:-/tmp/arcane-duel-release.tgz}"

cd "$APP_DIR"
test -f .env

find . -mindepth 1 -maxdepth 1 \
  ! -name '.env' \
  ! -name '.env.backup.*' \
  ! -name 'node_modules' \
  -exec rm -rf {} +

tar -xzf "$RELEASE_ARCHIVE" -C "$APP_DIR"
npm ci --omit=dev

node --check server/index.js
node --check server/auth.js
node --check server/db.js
node --check public/client.js
npm run test:smoke

sudo systemctl restart "$SERVICE_NAME"
sleep 2
systemctl is-active --quiet "$SERVICE_NAME"
curl -fsS --max-time 8 http://127.0.0.1:8443/auth/me >/dev/null
