'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi, photosApi } from '@/lib/api';
import ProductForm from '@/components/products/ProductForm';
import PhotoUploader from '@/components/products/PhotoUploader';
import type { CreateProductInput } from '@crystal-erp/shared';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<{ id: number; filename: string; isPrimary: boolean }[]>([]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProductInput) => productsApi.create(data),
    onSuccess: (res) => {
      setCreatedProductId(res.data.id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`商品已建立：${res.data.sku}`);
    },
    onError: () => toast.error('建立失敗，請重試'),
  });

  const handleSubmit = async (data: CreateProductInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleFinish = () => {
    if (createdProductId) {
      router.push(`/products/${createdProductId}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/products" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">新增水晶商品</h1>
      </div>

      {createMutation.isError && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          儲存失敗，請重試
        </div>
      )}

      {!createdProductId ? (
        <ProductForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
      ) : (
        <div className="space-y-5">
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
            ✓ 商品已建立！請上傳相片（可略過）
          </div>

          {/* 相片上傳 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">上傳商品相片</h2>
            <PhotoUploader productId={createdProductId} photos={photos} />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleFinish}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              完成，前往商品頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
