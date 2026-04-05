import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  mysqlEnum,
  boolean,
  timestamp,
  date,
  index,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// 商品分類
export const categories = mysqlTable('categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 10 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 商品主表
export const products = mysqlTable(
  'products',
  {
    id: int('id').primaryKey().autoincrement(),
    sku: varchar('sku', { length: 30 }).notNull().unique(),
    name: varchar('name', { length: 200 }).notNull(),
    categoryId: int('category_id').references(() => categories.id, { onDelete: 'set null' }),
    lengthMm: decimal('length_mm', { precision: 8, scale: 2 }),
    widthMm: decimal('width_mm', { precision: 8, scale: 2 }),
    heightMm: decimal('height_mm', { precision: 8, scale: 2 }),
    weightG: decimal('weight_g', { precision: 10, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
    listPrice: decimal('list_price', { precision: 10, scale: 2 }).notNull(),
    qualityDescription: text('quality_description'),
    status: mysqlEnum('status', ['in_stock', 'reserved', 'sold']).default('in_stock').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    statusIdx: index('status_idx').on(table.status),
    categoryIdx: index('category_idx').on(table.categoryId),
    skuIdx: index('sku_idx').on(table.sku),
  })
);

// 商品相片
export const productPhotos = mysqlTable('product_photos', {
  id: int('id').primaryKey().autoincrement(),
  productId: int('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 500 }).notNull(),
  originalName: varchar('original_name', { length: 500 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  sortOrder: int('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 銷售紀錄
export const sales = mysqlTable('sales', {
  id: int('id').primaryKey().autoincrement(),
  productId: int('product_id')
    .notNull()
    .references(() => products.id),
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }).notNull(),
  channel: mysqlEnum('channel', ['line', 'shopee', 'livestream', 'in_person', 'other']).notNull(),
  soldAt: date('sold_at').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  photos: many(productPhotos),
  sales: many(sales),
}));

export const productPhotosRelations = relations(productPhotos, ({ one }) => ({
  product: one(products, {
    fields: [productPhotos.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  product: one(products, {
    fields: [sales.productId],
    references: [products.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductPhoto = typeof productPhotos.$inferSelect;
export type NewProductPhoto = typeof productPhotos.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
