import { Hono } from 'hono';
import { db } from '../db/connection.js';
import { products, sales, categories } from '../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';

const app = new Hono();

app.get('/stats', async (c) => {
  // 各狀態商品數量與金額
  const statusStats = await db
    .select({
      status: products.status,
      count: sql<number>`COUNT(*)`,
      totalCost: sql<number>`SUM(${products.costPrice})`,
      totalList: sql<number>`SUM(${products.listPrice})`,
    })
    .from(products)
    .groupBy(products.status);

  // 各分類在庫數量
  const categoryStats = await db
    .select({
      categoryName: categories.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, 'in_stock'))
    .groupBy(categories.id, categories.name);

  // 已實現收入與毛利
  const revenueStats = await db
    .select({
      totalRevenue: sql<number>`SUM(${sales.salePrice})`,
      totalCost: sql<number>`SUM(${products.costPrice})`,
    })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id));

  // 近期 10 筆銷售
  const recentSales = await db
    .select({
      sale: sales,
      product: {
        id: products.id,
        sku: products.sku,
        name: products.name,
        costPrice: products.costPrice,
      },
    })
    .from(sales)
    .leftJoin(products, eq(sales.productId, products.id))
    .orderBy(desc(sales.soldAt), desc(sales.createdAt))
    .limit(10);

  const findStatus = (s: string) =>
    statusStats.find((r) => r.status === s);

  const inStock = findStatus('in_stock');
  const reserved = findStatus('reserved');
  const sold = findStatus('sold');

  const totalRevenue = Number(revenueStats[0]?.totalRevenue ?? 0);
  const totalSoldCost = Number(revenueStats[0]?.totalCost ?? 0);

  return c.json({
    data: {
      totalInStock: Number(inStock?.count ?? 0),
      totalReserved: Number(reserved?.count ?? 0),
      totalSold: Number(sold?.count ?? 0),
      totalCostBasis:
        Number(inStock?.totalCost ?? 0) +
        Number(reserved?.totalCost ?? 0) +
        Number(sold?.totalCost ?? 0),
      totalListValue:
        Number(inStock?.totalList ?? 0) +
        Number(reserved?.totalList ?? 0),
      realizedRevenue: totalRevenue,
      realizedProfit: totalRevenue - totalSoldCost,
      countByCategory: categoryStats.map((r) => ({
        categoryName: r.categoryName ?? '未分類',
        count: Number(r.count),
      })),
      recentSales: recentSales.map(({ sale, product }) => ({
        ...sale,
        product,
      })),
    },
  });
});

export default app;
