import ky from 'ky';
import type {
  Product,
  Category,
  Sale,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
  CreateProductInput,
  UpdateProductInput,
  CreateSaleInput,
  CreateCategoryInput,
} from '@crystal-erp/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const client = ky.create({
  prefixUrl: `${API_BASE}/api/v1`,
  timeout: 30000,
});

// 商品 API
export const productsApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.set(k, String(v));
      });
    }
    return client.get('products', { searchParams }).json<PaginatedResponse<Product & { primaryPhoto: { filename: string } | null }>>();
  },

  get: (id: number) =>
    client.get(`products/${id}`).json<ApiResponse<Product & { photos: { id: number; filename: string; isPrimary: boolean; sortOrder: number }[] }>>(),

  create: (data: CreateProductInput) =>
    client.post('products', { json: data }).json<ApiResponse<Product>>(),

  update: (id: number, data: UpdateProductInput) =>
    client.put(`products/${id}`, { json: data }).json<ApiResponse<Product>>(),

  delete: (id: number) => client.delete(`products/${id}`),

  qrUrl: (id: number) => `${API_BASE}/api/v1/products/${id}/qr`,
};

// 相片 API
export const photosApi = {
  upload: (productId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return client
      .post(`products/${productId}/photos`, { body: formData })
      .json<ApiResponse<{ id: number; filename: string; isPrimary: boolean }[]>>();
  },

  setPrimary: (photoId: number) =>
    client.put(`photos/${photoId}/primary`).json<ApiResponse<{ id: number; isPrimary: boolean }>>(),

  delete: (photoId: number) => client.delete(`photos/${photoId}`),

  url: (filename: string) => `${API_BASE}/photos/${filename}`,
};

// 分類 API
export const categoriesApi = {
  list: () => client.get('categories').json<ApiResponse<Category[]>>(),
  create: (data: CreateCategoryInput) =>
    client.post('categories', { json: data }).json<ApiResponse<Category>>(),
  delete: (id: number) => client.delete(`categories/${id}`),
};

// 銷售 API
export const salesApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') searchParams.set(k, String(v));
      });
    }
    return client.get('sales', { searchParams }).json<PaginatedResponse<Sale>>();
  },

  get: (id: number) => client.get(`sales/${id}`).json<ApiResponse<Sale>>(),

  create: (data: CreateSaleInput) =>
    client.post('sales', { json: data }).json<ApiResponse<Sale>>(),

  delete: (id: number) => client.delete(`sales/${id}`),
};

// 看板 API
export const dashboardApi = {
  stats: () => client.get('dashboard/stats').json<ApiResponse<DashboardStats>>(),
};
