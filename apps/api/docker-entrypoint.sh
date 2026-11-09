#!/bin/sh
set -e

echo "==> Running Prisma Database Migrations..."
npx prisma migrate deploy || echo "Migration notice: Tables may already be up to date."

echo "==> Starting eSushrut G5 API on port ${PORT:-4000}..."
exec "$@"
