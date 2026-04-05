'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, photosApi } from '@/lib/api';
import { cn, formatCurrency, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';
import type { ProductStatus } from '@crystal-erp/shared';

const STATUS_OPTIONS: { value: ProductStatus | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'in_stock', label: '在庫' },
  { value: 'reserved', label: '預訂' },
  { value: 'sold', label: '已售出' },
];

export default function ProductsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { q, status, page }],
    queryFn: () =>
      productsApi.list({
        q: q || undefined,
        status: status || undefined,
        page,
        limit: 24,
      }),
  });

  return (
    <div className="space-y-5">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">商品庫存</h1>
        <Link
          href="/products/new"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新增水晶
        </Link>
      </div>

      {/* 搜尋與篩選 */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋商品名稱..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setPage(1); }}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                status === opt.value
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 商品網格 */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse h-64" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">沒有符合條件的商品</p>
          <Link href="/products/new" className="text-purple-600 hover:underline text-sm mt-2 inline-block">
            新增第一件商品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
      )}

      {/* 分頁 */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(data.meta.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium',
                page === i + 1
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
