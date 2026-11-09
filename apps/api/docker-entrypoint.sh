#!/bin/sh
set -e

echo "==> [1/2] Synchronizing Database Schema & Creating Tables..."
npx prisma db push --skip-generate --accept-data-loss

echo "==> [2/2] Checking & Auto-Seeding Initial Data..."
node prisma/seed.js || echo "Seed notice: Seeding already completed."

echo "==> [3/3] Starting eSushrut G5 API Server on port ${PORT:-4000}..."
exec "$@"
