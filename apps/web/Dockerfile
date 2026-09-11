# Multi-platform Dockerfile for NextRound Web Client (Next.js 16)
# Supports linux/amd64 and linux/arm64 (macOS Apple Silicon, Linux, Windows WSL2)

FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copy monorepo package manifests
COPY package.json package-lock.json turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies across monorepo
RUN npm ci

# Copy source files
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Accept Next.js build-time public environment variables
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ARG NEXT_PUBLIC_AI_BASE_URL=http://localhost:8000

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_AI_BASE_URL=$NEXT_PUBLIC_AI_BASE_URL \
    NODE_ENV=production

# Build shared dependencies then build Next.js frontend
RUN npm run build --workspace=@nextround/shared
RUN npm run build --workspace=nextround-frontend

# ---------------------------------------------------------------------------
# Production Runner Image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

RUN apk add --no-cache curl

# Copy runtime packages and node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "start"]
