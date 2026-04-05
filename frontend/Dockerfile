FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=packages/shared --workspace=frontend

# Copy source
COPY packages/shared ./packages/shared
COPY frontend ./frontend

# Build shared then frontend
RUN npm run build --workspace=packages/shared

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=frontend

# --- Production runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js standalone output bundles only what's needed
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000

CMD ["node", "frontend/server.js"]
