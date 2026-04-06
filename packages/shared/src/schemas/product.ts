import { z } from 'zod';

export const ProductStatusSchema = z.enum(['in_stock', 'reserved', 'sold']);
export const SalesChannelSchema = z.enum(['line', 'shopee', 'livestream', 'in_person', 'other']);

export const CreateCategorySchema = z.object({
  name: z.string().min(1, '請輸入分類名稱').max(100),
  nameEn: z.string().min(1, '請輸入英文代碼（用於 SKU）').max(10).regex(/^[A-Z]+$/, '請使用大寫英文字母'),
});

const optionalDecimal = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().regex(/^\d+(\.\d{1,2})?$/, '請輸入有效數字').nullable().optional()
);

export const CreateProductSchema = z.object({
  name: z.string().min(1, '請輸入商品名稱').max(200),
  categoryId: z.number().int().positive().nullable().optional(),
  lengthMm: optionalDecimal,
  widthMm: optionalDecimal,
  heightMm: optionalDecimal,
  weightG: optionalDecimal,
  costPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, '請輸入有效進貨價'),
  listPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, '請輸入有效標售價'),
  qualityDescription: z.string().max(5000).nullable().optional(),
  status: ProductStatusSchema.optional().default('in_stock'),
  notes: z.string().max(2000).nullable().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateSaleSchema = z.object({
  productId: z.number().int().positive(),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, '請輸入有效成交價'),
  channel: SalesChannelSchema,
  soldAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '請輸入有效日期（YYYY-MM-DD）'),
  notes: z.string().max(2000).nullable().optional(),
});

export const ProductQuerySchema = z.object({
  status: ProductStatusSchema.optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  weightMin: z.coerce.number().positive().optional(),
  weightMax: z.coerce.number().positive().optional(),
  priceMin: z.coerce.number().positive().optional(),
  priceMax: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const SaleQuerySchema = z.object({
  q: z.string().optional(),
  channel: SalesChannelSchema.optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;
export type SaleQueryInput = z.infer<typeof SaleQuerySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
