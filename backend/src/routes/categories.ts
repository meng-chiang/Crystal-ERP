import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection.js';
import { categories } from '../db/schema.js';
import { CreateCategorySchema } from '@crystal-erp/shared';
import { eq } from 'drizzle-orm';

const app = new Hono();

// 取得所有分類
app.get('/', async (c) => {
  const data = await db.select().from(categories).orderBy(categories.name);
  return c.json({ data });
});

// 新增分類
app.post('/', zValidator('json', CreateCategorySchema), async (c) => {
  const input = c.req.valid('json');

  // 檢查名稱或代碼是否重複
  const existing = await db
    .select()
    .from(categories)
    .where(eq(categories.nameEn, input.nameEn.toUpperCase()))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: `英文代碼 "${input.nameEn}" 已存在` }, 400);
  }

  const [result] = await db.insert(categories).values({
    name: input.name,
    nameEn: input.nameEn.toUpperCase(),
  });

  const created = await db
    .select()
    .from(categories)
    .where(eq(categories.id, result.insertId))
    .limit(1);

  return c.json({ data: created[0] }, 201);
});

// 刪除分類
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: '無效的 ID' }, 400);

  await db.delete(categories).where(eq(categories.id, id));
  return c.body(null, 204);
});

export default app;
