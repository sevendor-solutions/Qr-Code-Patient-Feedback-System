# Multi-stage Dockerfile for eSushrut G5 Web App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Copy sources
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build shared & web application
RUN npm run build:shared
WORKDIR /app/apps/web
RUN npm run build

# Production Nginx Server
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
