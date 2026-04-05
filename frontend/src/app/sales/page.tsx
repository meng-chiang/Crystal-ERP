'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { salesApi } from '@/lib/api';
import { formatCurrency, formatDate, calculateProfit, CHANNEL_LABELS, cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sales', { page }],
    queryFn: () => salesApi.list({ page, limit: 20 }),
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

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 animate-pulse h-64" />
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>尚無銷售紀錄</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">日期</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">商品</th>
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
                      <td className="px-4 py-3 text-gray-600">{formatDate(String(sale.soldAt))}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{sale.product?.name}</p>
                          <p className="text-gray-400 text-xs font-mono">{sale.product?.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{CHANNEL_LABELS[sale.channel]}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(String(sale.salePrice))}
                      </td>
                      <td className={cn('px-4 py-3 text-right font-medium', profit >= 0 ? 'text-green-600' : 'text-red-500')}>
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
