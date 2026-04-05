import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { productPhotos, products } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { savePhoto, deletePhoto } from '../services/photo.js';
import Busboy from 'busboy';

const app = new Hono();

// 上傳商品相片
app.post('/products/:id/photos', async (c) => {
  const productId = parseInt(c.req.param('id'));
  if (isNaN(productId)) return c.json({ error: '無效的 ID' }, 400);

  const existing = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (existing.length === 0) return c.json({ error: '商品不存在' }, 404);

  const contentType = c.req.header('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return c.json({ error: '請使用 multipart/form-data 上傳' }, 400);
  }

  const rawBody = await c.req.arrayBuffer();
  const savedPhotos: typeof productPhotos.$inferSelect[] = [];

  await new Promise<void>((resolve, reject) => {
    const bb = Busboy({ headers: { 'content-type': contentType } });
    const filePromises: Promise<void>[] = [];

    bb.on('file', (_field, file, info) => {
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];

      file.on('data', (chunk: Buffer) => chunks.push(chunk));
      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const promise = savePhoto(buffer, filename, mimeType, productId)
          .then(async (saved) => {
            const [result] = await db.insert(productPhotos).values({
              productId,
              filename: saved.filename,
              originalName: saved.originalName,
              isPrimary: false,
              sortOrder: 0,
            });
            const photo = await db
              .select()
              .from(productPhotos)
              .where(eq(productPhotos.id, result.insertId))
              .limit(1);
            savedPhotos.push(photo[0]);
          })
          .catch(reject);
        filePromises.push(promise);
      });
    });

    bb.on('finish', () => Promise.all(filePromises).then(() => resolve()).catch(reject));
    bb.on('error', reject);

    bb.write(Buffer.from(rawBody));
    bb.end();
  });

  // 若目前沒有主相片，將第一張設為主相片
  const currentPrimary = await db
    .select()
    .from(productPhotos)
    .where(and(eq(productPhotos.productId, productId), eq(productPhotos.isPrimary, true)))
    .limit(1);

  if (currentPrimary.length === 0 && savedPhotos.length > 0) {
    await db
      .update(productPhotos)
      .set({ isPrimary: true })
      .where(eq(productPhotos.id, savedPhotos[0].id));
    savedPhotos[0].isPrimary = true;
  }

  return c.json({ data: savedPhotos }, 201);
});

// 設定主相片
app.put('/photos/:photoId/primary', async (c) => {
  const photoId = parseInt(c.req.param('photoId'));
  if (isNaN(photoId)) return c.json({ error: '無效的 ID' }, 400);

  const photo = await db.select().from(productPhotos).where(eq(productPhotos.id, photoId)).limit(1);
  if (photo.length === 0) return c.json({ error: '相片不存在' }, 404);

  // 取消同商品其他主相片
  await db
    .update(productPhotos)
    .set({ isPrimary: false })
    .where(eq(productPhotos.productId, photo[0].productId));

  await db.update(productPhotos).set({ isPrimary: true }).where(eq(productPhotos.id, photoId));

  return c.json({ data: { ...photo[0], isPrimary: true } });
});

// 刪除相片
app.delete('/photos/:photoId', async (c) => {
  const photoId = parseInt(c.req.param('photoId'));
  if (isNaN(photoId)) return c.json({ error: '無效的 ID' }, 400);

  const photo = await db.select().from(productPhotos).where(eq(productPhotos.id, photoId)).limit(1);
  if (photo.length === 0) return c.json({ error: '相片不存在' }, 404);

  await deletePhoto(photo[0].filename);
  await db.delete(productPhotos).where(eq(productPhotos.id, photoId));

  // 若刪除的是主相片，將最舊的相片設為主相片
  if (photo[0].isPrimary) {
    const remaining = await db
      .select()
      .from(productPhotos)
      .where(eq(productPhotos.productId, photo[0].productId))
      .orderBy(productPhotos.createdAt)
      .limit(1);

    if (remaining.length > 0) {
      await db
        .update(productPhotos)
        .set({ isPrimary: true })
        .where(eq(productPhotos.id, remaining[0].id));
    }
  }

  return c.body(null, 204);
});

export default app;
