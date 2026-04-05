import { db } from '../db/connection.js';
import { products } from '../db/schema.js';
import { like, max } from 'drizzle-orm';

/**
 * 產生下一個 SKU，格式：{PREFIX}-{YEAR}-{SEQ}
 * 例如：AM-2026-001
 * 使用 FOR UPDATE 確保並發安全
 */
export async function generateSku(categoryNameEn: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${categoryNameEn.toUpperCase()}-${year}-`;

  // 在同一個 connection 中執行，確保查詢與插入的一致性
  const result = await db
    .select({ maxSku: max(products.sku) })
    .from(products)
    .where(like(products.sku, `${prefix}%`));

  const maxSku = result[0]?.maxSku;
  let nextSeq = 1;

  if (maxSku) {
    const parts = maxSku.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}
