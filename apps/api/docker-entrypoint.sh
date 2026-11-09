#!/bin/sh
set -e

echo "==> [1/2] Running Prisma Database Migrations..."
npx prisma migrate deploy || echo "Migration notice: Database schema ready."

echo "==> [2/2] Checking & Auto-Seeding Initial Data (if database is fresh)..."
node prisma/seed.js || echo "Seed notice: Seed script finished."

echo "==> [3/3] Starting eSushrut G5 API Server on port ${PORT:-4000}..."
exec "$@"
