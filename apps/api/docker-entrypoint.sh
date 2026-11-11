#!/bin/sh

echo "==> [1/3] Synchronizing Database Schema & Creating Tables..."
npx prisma db push --skip-generate --accept-data-loss || echo "Prisma push notice: Continuing..."

echo "==> [2/3] Checking & Auto-Seeding Initial Data..."
node prisma/seed.js || echo "Seed notice: Seeding completed or skipped."

echo "==> [3/3] Starting eSushrut G5 API Server on port ${PORT:-4000}..."
if [ -f "dist/src/main.js" ]; then
  exec node dist/src/main.js
elif [ -f "dist/apps/api/src/main.js" ]; then
  exec node dist/apps/api/src/main.js
elif [ -f "dist/main.js" ]; then
  exec node dist/main.js
else
  exec "$@"
fi
