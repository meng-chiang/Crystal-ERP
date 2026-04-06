import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/connection.js';
import { sales, products, categories } from '../db/schema.js';
import { CreateSaleSchema, SaleQuerySchema } from '@crystal-erp/shared';
import { eq, and, gte, lte, sql, desc, like, or } from 'drizzle-orm';

const app = new Hono();

// 銷售紀錄列表
app.get('/', zValidator('query', SaleQuerySchema), async (c) => {
  const query = c.req.valid('query');
  const { q, channel, categoryId, from, to, page, limit } = query;

  const conditions = [];
  if (channel) conditions.push(eq(sales.channel, channel));
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (from) conditions.push(gte(sales.soldAt, new Date(from)));
  if (to) conditions.push(lte(sales.soldAt, new Date(to)));
  if (q) conditions.push(or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`))!);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .where(whereClause);

  const total = Number(countResult.count);
  const offset = (page - 1) * limit;

  const rows = await db
    .select({ sale: sales, product: products, category: categories })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(sales.soldAt), desc(sales.createdAt))
    .limit(limit)
    .offset(offset);

  const data = rows.map(({ sale, product, category }) => ({
    ...sale,
    product: product
      ? {
          id: product.id,
          sku: product.sku,
          name: product.name,
          costPrice: product.costPrice,
          categoryName: category?.name ?? null,
        }
      : null,
  }));

  return c.json({
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// 取得單筆銷售
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: '無效的 ID' }, 400);

  const rows = await db
    .select({ sale: sales, product: products, category: categories })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(sales.id, id))
    .limit(1);

  if (rows.length === 0) return c.json({ error: '銷售紀錄不存在' }, 404);

  const { sale, product, category } = rows[0];
  return c.json({
    data: {
      ...sale,
      product: product
        ? { id: product.id, sku: product.sku, name: product.name, costPrice: product.costPrice, categoryName: category?.name ?? null }
        : null,
    },
  });
});

// 新增銷售（原子交易：同時更新商品狀態）
app.post('/', zValidator('json', CreateSaleSchema), async (c) => {
  const input = c.req.valid('json');

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);

  if (product.length === 0) return c.json({ error: '商品不存在' }, 404);
  if (product[0].status === 'sold') return c.json({ error: '此商品已售出' }, 400);

  let saleId: number;

  await db.transaction(async (tx) => {
    const [result] = await tx.insert(sales).values({
      productId: input.productId,
      salePrice: input.salePrice,
      channel: input.channel,
      soldAt: new Date(input.soldAt),
      notes: input.notes ?? null,
    });
    saleId = result.insertId;

    await tx.update(products).set({ status: 'sold' }).where(eq(products.id, input.productId));
  });

  const rows = await db
    .select({ sale: sales, product: products, category: categories })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(sales.id, saleId!))
    .limit(1);

  const { sale, product: p, category: cat } = rows[0];
  return c.json(
    {
      data: {
        ...sale,
        product: p
          ? { id: p.id, sku: p.sku, name: p.name, costPrice: p.costPrice, categoryName: cat?.name ?? null }
          : null,
      },
    },
    201
  );
});

// 刪除銷售（還原商品狀態為 in_stock）
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: '無效的 ID' }, 400);

  const existing = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  if (existing.length === 0) return c.json({ error: '銷售紀錄不存在' }, 404);

  await db.transaction(async (tx) => {
    await tx.delete(sales).where(eq(sales.id, id));
    await tx
      .update(products)
      .set({ status: 'in_stock' })
      .where(eq(products.id, existing[0].productId));
  });

  return c.body(null, 204);
});

export default app;
