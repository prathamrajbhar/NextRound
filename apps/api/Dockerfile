# Multi-platform Dockerfile for NextRound API Server (Express + Prisma + BullMQ)
# Supports linux/amd64 and linux/arm64 (macOS Apple Silicon, Linux, Windows WSL2)

FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools needed for native node dependencies
RUN apk add --no-cache python3 make g++ openssl

# Copy monorepo package manifests
COPY package.json package-lock.json turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies across monorepo
RUN npm ci

# Copy shared source code and configurations
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client and compile internal shared packages
RUN npm run db:generate
RUN npm run build --workspace=@nextround/config || true
RUN npm run build --workspace=@nextround/shared
RUN npm run build --workspace=@nextround/database
RUN npm run build --workspace=@nextround/api

# ---------------------------------------------------------------------------
# Production Runner Image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

RUN apk add --no-cache openssl curl

# Copy runtime packages and node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/index.js"]
