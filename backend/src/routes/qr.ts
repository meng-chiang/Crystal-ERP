import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateQrPng } from '../services/qr.js';

const app = new Hono();

app.get('/products/:id/qr', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: '無效的 ID' }, 400);

  const product = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (product.length === 0) return c.json({ error: '商品不存在' }, 404);

  // QR Code 內容：前端商品詳情頁網址（前端可配置 FRONTEND_URL 環境變數）
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const qrText = `${frontendUrl}/products/${id}`;

  const png = await generateQrPng(qrText);

  return c.body(new Uint8Array(png), 200, {
    'Content-Type': 'image/png',
    'Content-Disposition': `inline; filename="qr-${product[0].sku}.png"`,
    'Cache-Control': 'public, max-age=3600',
  });
});

export default app;
