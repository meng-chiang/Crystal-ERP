import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection.js';
import { products, productPhotos, categories } from '../db/schema.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
} from '@crystal-erp/shared';
import { eq, and, like, gte, lte, sql, desc, inArray } from 'drizzle-orm';
import { generateSku } from '../services/sku.js';

const app = new Hono();

// 商品列表（含篩選分頁）
app.get('/', zValidator('query', ProductQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const { status, categoryId, q, weightMin, weightMax, priceMin, priceMax, page, limit } = query;

  const conditions = [];

  if (status) conditions.push(eq(products.status, status));
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (q) conditions.push(like(products.name, `%${q}%`));
  if (weightMin !== undefined) conditions.push(gte(products.weightG, String(weightMin)));
  if (weightMax !== undefined) conditions.push(lte(products.weightG, String(weightMax)));
  if (priceMin !== undefined) conditions.push(gte(products.listPrice, String(priceMin)));
  if (priceMax !== undefined) conditions.push(lte(products.listPrice, String(priceMax)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(products)
    .where(whereClause);

  const total = Number(countResult.count);
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      product: products,
      category: categories,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  // 取得主相片
  const productIds = rows.map((r) => r.product.id);
  const primaryPhotos =
    productIds.length > 0
      ? await db
          .select()
          .from(productPhotos)
          .where(and(inArray(productPhotos.productId, productIds), eq(productPhotos.isPrimary, true)))
      : [];

  const photoMap = new Map(primaryPhotos.map((p) => [p.productId, p]));

  const data = rows.map(({ product, category }) => ({
    ...product,
    category: category ?? null,
    primaryPhoto: photoMap.get(product.id) ?? null,
  }));

  return c.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 取得單一商品（含所有相片）
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: '無效的 ID' }, 400);

  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  if (rows.length === 0) return c.json({ error: '商品不存在' }, 404);

  const photos = await db
    .select()
    .from(productPhotos)
    .where(eq(productPhotos.productId, id))
    .orderBy(productPhotos.sortOrder, productPhotos.createdAt);

  return c.json({
    data: {
      ...rows[0].product,
      category: rows[0].category ?? null,
      photos,
    },
  });
});

// 新增商品
app.post('/', zValidator('json', CreateProductSchema), async (c) => {
  const input = c.req.valid('json');

  // 產生 SKU
  let sku: string;
  if (input.categoryId) {
    const cat = await db
      .select()
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .limit(1);
    if (cat.length === 0) return c.json({ error: '分類不存在' }, 400);
    sku = await generateSku(cat[0].nameEn);
  } else {
    sku = await generateSku('XX');
  }

  const [result] = await db.insert(products).values({
    sku,
    name: input.name,
    categoryId: input.categoryId ?? null,
    lengthMm: input.lengthMm ?? null,
    widthMm: input.widthMm ?? null,
    heightMm: input.heightMm ?? null,
    weightG: input.weightG ?? null,
    costPrice: input.costPrice,
    listPrice: input.listPrice,
    qualityDescription: input.qualityDescription ?? null,
    status: input.status ?? 'in_stock',
    notes: input.notes ?? null,
  });

  const created = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, result.insertId))
    .limit(1);

  return c.json({ data: { ...created[0].product, category: created[0].category ?? null, photos: [] } }, 201);
});

// 更新商品
app.put('/:id', zValidator('json', UpdateProductSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: '無效的 ID' }, 400);

  const input = c.req.valid('json');

  const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (existing.length === 0) return c.json({ error: '商品不存在' }, 404);

  const updateData: Partial<typeof products.$inferInsert> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId ?? null;
  if (input.lengthMm !== undefined) updateData.lengthMm = input.lengthMm ?? null;
  if (input.widthMm !== undefined) updateData.widthMm = input.widthMm ?? null;
  if (input.heightMm !== undefined) updateData.heightMm = input.heightMm ?? null;
  if (input.weightG !== undefined) updateData.weightG = input.weightG ?? null;
  if (input.costPrice !== undefined) updateData.costPrice = input.costPrice;
  if (input.listPrice !== undefined) updateData.listPrice = input.listPrice;
  if (input.qualityDescription !== undefined) updateData.qualityDescription = input.qualityDescription ?? null;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.notes !== undefined) updateData.notes = input.notes ?? null;

  await db.update(products).set(updateData).where(eq(products.id, id));

  const updated = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  const photos = await db
    .select()
    .from(productPhotos)
    .where(eq(productPhotos.productId, id))
    .orderBy(productPhotos.sortOrder);

  return c.json({ data: { ...updated[0].product, category: updated[0].category ?? null, photos } });
});

// 刪除商品（只允許 in_stock 狀態）
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: '無效的 ID' }, 400);

  const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (existing.length === 0) return c.json({ error: '商品不存在' }, 404);

  if (existing[0].status !== 'in_stock') {
    return c.json({ error: '只能刪除「在庫」狀態的商品' }, 400);
  }

  await db.delete(products).where(eq(products.id, id));
  return c.body(null, 204);
});

export default app;
