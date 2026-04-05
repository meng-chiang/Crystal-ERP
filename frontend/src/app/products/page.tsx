'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, photosApi } from '@/lib/api';
import { cn, formatCurrency, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import ProductFilters, { DEFAULT_FILTERS, isFilterActive, type ProductFilterValues } from '@/components/products/ProductFilters';
import Pagination from '@/components/ui/Pagination';

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const handleFiltersChange = (newFilters: ProductFilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

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

  const activeFilterCount = useMemo(() => [
    filters.status,
    filters.categoryId,
    filters.weightMin || filters.weightMax,
    filters.priceMin || filters.priceMax,
  ].filter(Boolean).length, [filters]);

  return (
    <div className="space-y-5">
      {/* 標題列 */}
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

      {/* 搜尋列 + 篩選按鈕 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋商品名稱..."
            value={filters.q}
            onChange={(e) => handleFiltersChange({ ...filters, q: e.target.value })}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
            showFilters || activeFilterCount > 0
              ? 'bg-purple-50 border-purple-300 text-purple-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          篩選
          {activeFilterCount > 0 && (
            <span className="bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* 篩選側欄 */}
        {showFilters && (
          <div className="w-56 flex-shrink-0">
            <ProductFilters filters={filters} onChange={handleFiltersChange} />
          </div>
        )}

        {/* 商品網格 */}
        <div className="flex-1 space-y-4">
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
              <Link href="/products/new" className="text-purple-600 hover:underline text-sm mt-2 inline-block">
                新增第一件商品
              </Link>
            </div>
          ) : (
            <>
              <div className={cn(
                'grid gap-4',
                showFilters
                  ? 'grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              )}>
                {data?.data.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                      {/* 相片 */}
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
                      {/* 資訊 */}
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
      </div>
    </div>
  );
}
