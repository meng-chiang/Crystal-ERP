import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { join } from 'path';

import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import photosRouter from './routes/photos.js';
import salesRouter from './routes/sales.js';
import dashboardRouter from './routes/dashboard.js';
import qrRouter from './routes/qr.js';

const app = new Hono();

// Middleware
app.use('*', logger());
const allowedOrigins = [
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()) : []),
];

app.use(
  '*',
  cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// 靜態相片服務
const uploadDir = process.env.UPLOAD_DIR || './storage/photos';
app.use(
  '/photos/*',
  serveStatic({
    root: uploadDir,
    rewriteRequestPath: (path) => path.replace(/^\/photos/, ''),
  })
);

// API 路由
app.route('/api/v1/categories', categoriesRouter);
app.route('/api/v1/products', productsRouter);
app.route('/api/v1', photosRouter);
app.route('/api/v1/sales', salesRouter);
app.route('/api/v1/dashboard', dashboardRouter);
app.route('/api/v1', qrRouter);

// 健康檢查
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 全域錯誤處理
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: '伺服器錯誤', details: err.message }, 500);
});

app.notFound((c) => c.json({ error: '找不到此路由' }, 404));

const port = parseInt(process.env.PORT || '3001');

console.log(`🔮 Crystal ERP 後端啟動中，PORT: ${port}`);

serve({ fetch: app.fetch, port });
