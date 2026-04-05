FROM node:20-alpine AS builder

WORKDIR /app

# 複製 workspace 設定
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/

# 安裝所有依賴
RUN npm install --workspace=packages/shared --workspace=backend

# 複製原始碼
COPY packages/shared ./packages/shared
COPY backend ./backend

# 編譯 shared
RUN npm run build --workspace=packages/shared

# 編譯 backend
RUN npm run build --workspace=backend

# --- 執行階段 ---
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/
COPY package.json ./

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
