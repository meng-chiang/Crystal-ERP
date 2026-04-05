'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ProductStatus } from '@crystal-erp/shared';
import { X } from 'lucide-react';

export interface ProductFilterValues {
  q: string;
  status: ProductStatus | '';
  categoryId: number | '';
  weightMin: string;
  weightMax: string;
  priceMin: string;
  priceMax: string;
}

const DEFAULT_FILTERS: ProductFilterValues = {
  q: '',
  status: '',
  categoryId: '',
  weightMin: '',
  weightMax: '',
  priceMin: '',
  priceMax: '',
};

export function isFilterActive(filters: ProductFilterValues): boolean {
  return filters.q !== '' || filters.status !== '' || filters.categoryId !== '' ||
    filters.weightMin !== '' || filters.weightMax !== '' ||
    filters.priceMin !== '' || filters.priceMax !== '';
}

interface ProductFiltersProps {
  filters: ProductFilterValues;
  onChange: (filters: ProductFilterValues) => void;
}

const STATUS_OPTIONS: { value: ProductStatus | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'in_stock', label: '在庫' },
  { value: 'reserved', label: '預訂' },
  { value: 'sold', label: '已售出' },
];

export default function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: 60 * 60 * 1000, // categories rarely change
  });

  const set = (partial: Partial<ProductFilterValues>) =>
    onChange({ ...filters, ...partial });

  const reset = () => onChange({ ...DEFAULT_FILTERS });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">篩選條件</span>
        {isFilterActive(filters) && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
            清除篩選
          </button>
        )}
      </div>

      {/* 狀態 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">狀態</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => set({ status: opt.value })}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                filters.status === opt.value
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分類 */}
      {categoriesData?.data && categoriesData.data.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">分類</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => set({ categoryId: '' })}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                filters.categoryId === ''
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              全部
            </button>
            {categoriesData.data.map((cat) => (
              <button
                key={cat.id}
                onClick={() => set({ categoryId: cat.id })}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  filters.categoryId === cat.id
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 重量範圍 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">重量 (g)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="最小"
            value={filters.weightMin}
            onChange={(e) => set({ weightMin: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-gray-300 text-xs">—</span>
          <input
            type="number"
            placeholder="最大"
            value={filters.weightMax}
            onChange={(e) => set({ weightMax: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* 價格範圍 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">標售價 ($)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="最低"
            value={filters.priceMin}
            onChange={(e) => set({ priceMin: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-gray-300 text-xs">—</span>
          <input
            type="number"
            placeholder="最高"
            value={filters.priceMax}
            onChange={(e) => set({ priceMax: e.target.value })}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_FILTERS };
