export type ProductStatus = 'in_stock' | 'reserved' | 'sold';

export type SalesChannel = 'line' | 'shopee' | 'livestream' | 'in_person' | 'other';

export interface Category {
  id: number;
  name: string;
  nameEn: string;
  createdAt: Date;
}

export interface ProductPhoto {
  id: number;
  productId: number;
  filename: string;
  originalName: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number | null;
  category?: Category;
  lengthMm: string | null;
  widthMm: string | null;
  heightMm: string | null;
  weightG: string | null;
  costPrice: string;
  listPrice: string;
  qualityDescription: string | null;
  status: ProductStatus;
  notes: string | null;
  photos?: ProductPhoto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: number;
  productId: number;
  product?: Pick<Product, 'id' | 'sku' | 'name' | 'costPrice'>;
  salePrice: string;
  channel: SalesChannel;
  soldAt: string;
  notes: string | null;
  createdAt: Date;
}

export interface DashboardStats {
  totalInStock: number;
  totalReserved: number;
  totalSold: number;
  totalCostBasis: number;
  totalListValue: number;
  realizedRevenue: number;
  realizedProfit: number;
  countByCategory: Array<{ categoryName: string; count: number }>;
  recentSales: Array<Sale & { product: Pick<Product, 'sku' | 'name' | 'costPrice'> }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
