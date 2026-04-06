'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, photosApi, categoriesApi } from '@/lib/api';
import { cn, formatCurrency, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import type { ProductStatus } from '@crystal-erp/shared';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';
import { isFilterActive, type ProductFilterValues, DEFAULT_FILTERS } from '@/components/products/ProductFilters';
import Pagination from '@/components/ui/Pagination';

const STATUS_OPTIONS: { value: ProductStatus | ''; label: string }[] = [
  { value: '', label: '全部狀態' },
  { value: 'in_stock', label: '在庫' },
  { value: 'reserved', label: '預訂' },
  { value: 'sold', label: '已售出' },
];

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: 60 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { filters, page }],
    queryFn: () =>
      productsApi.list({
        q: filters.q || undefined,
        status: filters.status || undefined,
        categoryId: filters.categoryId || undefined,
        weightMin: filters.weightMin ? Number(filters.weightMin) : undefined,
        weightMax: filters.weightMax ? Number(filters.weightMax) : undefined,
        priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
        page,
        limit: 24,
      }),
  });

  function setFilter<K extends keyof ProductFilterValues>(key: K, value: ProductFilterValues[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品庫存</h1>
          {data && (
            <p className="text-sm text-gray-400 mt-0.5">共 {data.meta.total} 件商品</p>
          )}
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新增水晶
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-gray-500 mb-1">商品名稱 / SKU</label>
            <input
              type="text"
              placeholder="搜尋商品名稱..."
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="min-w-36">
            <label className="block text-xs text-gray-500 mb-1">分類</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilter('categoryId', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            >
              <option value="">全部分類</option>
              {categoriesData?.data.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="min-w-32">
            <label className="block text-xs text-gray-500 mb-1">狀態</label>
            <select
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value as ProductStatus | '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">重量 (g)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="最小"
                value={filters.weightMin}
                onChange={(e) => setFilter('weightMin', e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="number"
                placeholder="最大"
                value={filters.weightMax}
                onChange={(e) => setFilter('weightMax', e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">標售價 ($)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="最低"
                value={filters.priceMin}
                onChange={(e) => setFilter('priceMin', e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <span className="text-gray-300 text-xs">—</span>
              <input
                type="number"
                placeholder="最高"
                value={filters.priceMax}
                onChange={(e) => setFilter('priceMax', e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>

          {isFilterActive(filters) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              清除
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse h-64" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">
            {isFilterActive(filters) ? '沒有符合篩選條件的商品' : '尚無商品'}
          </p>
          {!isFilterActive(filters) && (
            <Link href="/products/new" className="text-purple-600 hover:underline text-sm mt-2 inline-block">
              新增第一件商品
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.data.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="aspect-square bg-gray-100 relative">
                    {product.primaryPhoto ? (
                      <img
                        src={photosApi.url(product.primaryPhoto.filename)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                        💎
                      </div>
                    )}
                    <span
                      className={cn(
                        'absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium',
                        STATUS_COLORS[product.status]
                      )}
                    >
                      {STATUS_LABELS[product.status]}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
                    <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{product.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold text-purple-700">
                        {formatCurrency(product.listPrice)}
                      </span>
                      {product.weightG && (
                        <span className="text-xs text-gray-400">{product.weightG}g</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {data && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
