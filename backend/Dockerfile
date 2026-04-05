FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

RUN npm ci --workspace=packages/shared --workspace=backend

# Copy source
COPY packages/shared ./packages/shared
COPY backend ./backend

# Build shared then backend
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=backend

# --- Production runner ---
FROM node:20-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production

# Only copy what's needed to run
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./

EXPOSE 3001

CMD ["node", "dist/index.js"]
