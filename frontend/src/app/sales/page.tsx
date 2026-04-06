'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { salesApi, categoriesApi } from '@/lib/api';
import { formatCurrency, formatDate, calculateProfit, CHANNEL_LABELS, cn } from '@/lib/utils';
import type { SalesChannel } from '@crystal-erp/shared';
import { Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Filters {
  q: string;
  channel: SalesChannel | '';
  categoryId: string;
  from: string;
  to: string;
}

const DEFAULT_FILTERS: Filters = { q: '', channel: '', categoryId: '', from: '', to: '' };

function hasActiveFilters(f: Filters) {
  return f.q !== '' || f.channel !== '' || f.categoryId !== '' || f.from !== '' || f.to !== '';
}

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: 60 * 60 * 1000,
  });

  const queryParams = {
    page,
    limit: 20,
    ...(filters.q && { q: filters.q }),
    ...(filters.channel && { channel: filters.channel }),
    ...(filters.categoryId && { categoryId: Number(filters.categoryId) }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['sales', queryParams],
    queryFn: () => salesApi.list(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('銷售紀錄已刪除，商品狀態已恢復為在庫');
      setDeleteId(null);
    },
    onError: () => toast.error('刪除失敗，請重試'),
  });

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
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
          <h1 className="text-2xl font-bold text-gray-900">銷售紀錄</h1>
          {data && (
            <p className="text-sm text-gray-400 mt-0.5">共 {data.meta.total} 筆紀錄</p>
          )}
        </div>
        <Link
          href="/sales/new"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          記錄銷售
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-gray-500 mb-1">商品名稱 / SKU</label>
            <input
              type="text"
              placeholder="搜尋..."
              value={filters.q}
              onChange={(e) => setFilter('q', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="min-w-36">
            <label className="block text-xs text-gray-500 mb-1">分類</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilter('categoryId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            >
              <option value="">全部分類</option>
              {categoriesData?.data.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="min-w-32">
            <label className="block text-xs text-gray-500 mb-1">通路</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilter('channel', e.target.value as SalesChannel | '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            >
              <option value="">全部通路</option>
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="min-w-36">
            <label className="block text-xs text-gray-500 mb-1">開始日期</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilter('from', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div className="min-w-36">
            <label className="block text-xs text-gray-500 mb-1">結束日期</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilter('to', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {hasActiveFilters(filters) && (
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
        <div className="bg-white rounded-xl border border-gray-200 animate-pulse h-64" />
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>{hasActiveFilters(filters) ? '找不到符合條件的銷售紀錄' : '尚無銷售紀錄'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">日期</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">商品</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">分類</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">通路</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">成交價</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">毛利</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((sale) => {
                  const profit = calculateProfit(sale.salePrice, sale.product?.costPrice);
                  return (
                    <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(String(sale.soldAt))}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{sale.product?.name}</p>
                        <p className="text-gray-400 text-xs font-mono">{sale.product?.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {sale.product?.categoryName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{CHANNEL_LABELS[sale.channel]}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(String(sale.salePrice))}
                      </td>
                      <td className={cn('px-4 py-3 text-right font-medium whitespace-nowrap', profit >= 0 ? 'text-green-600' : 'text-red-500')}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteId(sale.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data && <Pagination page={page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="確認刪除銷售紀錄"
        description="刪除後，商品狀態將恢復為「在庫」。此操作無法還原。"
        confirmLabel="確認刪除"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        destructive
      />
    </div>
  );
}
