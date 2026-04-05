'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { CreateProductSchema, type CreateProductInput } from '@crystal-erp/shared';

interface ProductFormProps {
  defaultValues?: Partial<CreateProductInput>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isLoading?: boolean;
}

export default function ProductForm({ defaultValues, onSubmit, isLoading }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: defaultValues ?? { status: 'in_stock' },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本資訊 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">基本資訊</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品名稱 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="例：紫水晶原礦"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
            <select
              {...register('categoryId', { setValueAs: (v) => (v === '' ? null : parseInt(v)) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="">請選擇分類</option>
              {categoriesData?.data.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="in_stock">在庫</option>
            <option value="reserved">預訂</option>
            <option value="sold">已售出</option>
          </select>
        </div>
      </div>

      {/* 規格 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">規格尺寸</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">長度 (mm)</label>
            <input
              {...register('lengthMm')}
              placeholder="例：50"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.lengthMm && <p className="text-red-500 text-xs mt-1">{errors.lengthMm.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">寬度 (mm)</label>
            <input
              {...register('widthMm')}
              placeholder="例：30"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">高度 (mm)</label>
            <input
              {...register('heightMm')}
              placeholder="例：20"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">重量 (g)</label>
            <input
              {...register('weightG')}
              placeholder="例：85.5"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.weightG && <p className="text-red-500 text-xs mt-1">{errors.weightG.message}</p>}
          </div>
        </div>
      </div>

      {/* 價格 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">價格</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              進貨價（成本）<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                {...register('costPrice')}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              標售價 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                {...register('listPrice')}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {errors.listPrice && <p className="text-red-500 text-xs mt-1">{errors.listPrice.message}</p>}
          </div>
        </div>
      </div>

      {/* 品相描述 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">品相與備註</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">品相描述</label>
          <textarea
            {...register('qualityDescription')}
            rows={3}
            placeholder="例：冰裂少，棉絮分布均勻，強螢光反應，無明顯雜質..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="其他備註事項..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
      </div>

      {/* 提交 */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '儲存中...' : '儲存商品'}
        </button>
      </div>
    </form>
  );
}
