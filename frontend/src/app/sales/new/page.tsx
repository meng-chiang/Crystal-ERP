'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesApi, productsApi } from '@/lib/api';
import { CreateSaleSchema, type CreateSaleInput } from '@crystal-erp/shared';
import { formatCurrency, CHANNEL_LABELS } from '@/lib/utils';
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

function NewSaleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preselectedId = searchParams.get('productId');

  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    preselectedId ? parseInt(preselectedId) : null
  );

  const { data: productsData } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: () =>
      productsApi.list({ q: productSearch || undefined, status: 'in_stock', limit: 10 }),
    enabled: !selectedProductId,
  });

  const { data: selectedProductData } = useQuery({
    queryKey: ['product', selectedProductId],
    queryFn: () => productsApi.get(selectedProductId!),
    enabled: !!selectedProductId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateSaleInput>({
    resolver: zodResolver(CreateSaleSchema),
    defaultValues: {
      productId: selectedProductId ?? undefined,
      soldAt: new Date().toISOString().split('T')[0],
      channel: 'line',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSaleInput) => salesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('銷售已記錄');
      router.push('/sales');
    },
    onError: () => toast.error('記錄失敗，請重試'),
  });

  const selectProduct = (id: number) => {
    setSelectedProductId(id);
    setValue('productId', id);
    setProductSearch('');
  };

  const selectedProduct = selectedProductData?.data;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sales" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">記錄銷售</h1>
      </div>

      <form onSubmit={handleSubmit((d) => createMutation.mutateAsync(d))} className="space-y-4">
        {/* 選擇商品 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">選擇商品</h2>

          {selectedProduct ? (
            <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
              <div>
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500 font-mono">{selectedProduct.sku}</p>
                <p className="text-sm text-purple-700 mt-0.5">
                  標價 {formatCurrency(selectedProduct.listPrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedProductId(null); setValue('productId', undefined as unknown as number); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                更換
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋在庫商品..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {productsData?.data && productsData.data.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  {productsData.data.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku} · {formatCurrency(p.listPrice)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.productId && (
            <p className="text-red-500 text-xs">{errors.productId.message}</p>
          )}
        </div>

        {/* 銷售資訊 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">銷售資訊</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              實際成交價 <span className="text-red-500">*</span>
              {selectedProduct && (
                <span className="text-gray-400 font-normal ml-1">
                  （標價 {formatCurrency(selectedProduct.listPrice)}）
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                {...register('salePrice')}
                defaultValue={selectedProduct?.listPrice}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.salePrice && <p className="text-red-500 text-xs mt-1">{errors.salePrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              銷售通路 <span className="text-red-500">*</span>
            </label>
            <select
              {...register('channel')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              售出日期 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('soldAt')}
              type="date"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.soldAt && <p className="text-red-500 text-xs mt-1">{errors.soldAt.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="買家資訊、特殊備注..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
        </div>

        {createMutation.isError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            儲存失敗，請重試
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/sales"
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || !selectedProductId}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {createMutation.isPending ? '儲存中...' : '確認銷售'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewSalePage() {
  return (
    <Suspense>
      <NewSaleForm />
    </Suspense>
  );
}
