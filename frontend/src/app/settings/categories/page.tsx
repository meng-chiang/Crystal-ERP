'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { categoriesApi } from '@/lib/api';
import { CreateCategorySchema, type CreateCategoryInput } from '@crystal-erp/shared';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`分類「${res.data.name}」已新增（SKU 前綴：${res.data.nameEn}）`);
      reset();
    },
    onError: (err: Error) => toast.error(err.message || '新增失敗'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分類已刪除');
      setDeleteTarget(null);
    },
    onError: () => toast.error('刪除失敗，請重試'),
  });

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/products" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">商品分類管理</h1>
      </div>

      {/* 新增分類 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">新增分類</h2>
        <form onSubmit={handleSubmit((d) => createMutation.mutateAsync(d))} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分類名稱 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="例：紫水晶"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              英文代碼（SKU 前綴）<span className="text-red-500">*</span>
            </label>
            <input
              {...register('nameEn')}
              placeholder="例：AM（Amethyst）"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
            />
            <p className="text-xs text-gray-400 mt-1">僅限大寫英文字母，用於自動產生 SKU，如：AM-2026-001</p>
            {errors.nameEn && <p className="text-red-500 text-xs mt-1">{errors.nameEn.message}</p>}
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? '新增中...' : '新增分類'}
          </button>
        </form>
      </div>

      {/* 分類列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">現有分類</h2>
        </div>
        {isLoading ? (
          <div className="p-5 animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="p-5 text-center text-gray-400 text-sm">尚無分類</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.data.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="font-medium text-gray-900">{cat.name}</span>
                  <span className="ml-2 text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                    {cat.nameEn}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="確認刪除分類"
        description={`確定要刪除分類「${deleteTarget?.name}」嗎？已使用此分類的商品不會被刪除，但分類欄位將變為空白。`}
        confirmLabel="確認刪除"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        destructive
      />
    </div>
  );
}
