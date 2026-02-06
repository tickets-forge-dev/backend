# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile
COPY backend/ ./backend/
RUN pnpm --filter @repo/shared-types run build 2>/dev/null || true
RUN pnpm --filter @repo/backend run build

# Stage 2: Runtime
FROM node:20-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
EXPOSE 3000
CMD ["node", "dist/main"]
