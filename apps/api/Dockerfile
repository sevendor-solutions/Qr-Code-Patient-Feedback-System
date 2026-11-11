# ==============================================================================
# Ultra-Low Footprint Multi-Stage Dockerfile for eSushrut G5 API (NestJS)
# Final Image Size: ~140 MB (Alpine Linux + Pruned Production Modules Only)
# ==============================================================================

# STAGE 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma client generation
RUN apk add --no-cache openssl

# Copy workspace package manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Clean install all dependencies (including devDependencies for TypeScript compilation)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package and generate Prisma Client
RUN npm run build:shared
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Prune devDependencies to keep final production node_modules as small as possible
WORKDIR /app
RUN npm prune --omit=dev --no-audit --no-fund

# ==============================================================================
# STAGE 2: Lightweight Production Runner
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install OpenSSL (required by Prisma binary engine)
RUN apk add --no-cache openssl dumb-init \
    && rm -rf /var/cache/apk/* /tmp/*

# Copy root manifests and pruned production dependencies from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY apps/api/docker-entrypoint.sh ./apps/api/

# Create uploads directory and set permissions
WORKDIR /app/apps/api
RUN mkdir -p uploads && chmod +x docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
