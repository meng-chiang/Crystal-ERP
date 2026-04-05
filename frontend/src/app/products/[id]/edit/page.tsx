'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi } from '@/lib/api';
import ProductForm from '@/components/products/ProductForm';
import type { CreateProductInput } from '@crystal-erp/shared';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = parseInt(id as string);

  const { data, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId),
  });

  const updateMutation = useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.update(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('商品已更新');
      router.push(`/products/${productId}`);
    },
    onError: () => toast.error('更新失敗，請重試'),
  });

  if (isLoading) return <div className="animate-pulse bg-white rounded-xl h-96" />;

  const product = data?.data;
  if (!product) return <div className="text-red-500">商品不存在</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/products/${productId}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">編輯商品</h1>
      </div>

      {updateMutation.isError && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          儲存失敗，請重試
        </div>
      )}

      <ProductForm
        defaultValues={{
          name: product.name,
          categoryId: product.categoryId ?? undefined,
          lengthMm: product.lengthMm ?? undefined,
          widthMm: product.widthMm ?? undefined,
          heightMm: product.heightMm ?? undefined,
          weightG: product.weightG ?? undefined,
          costPrice: product.costPrice,
          listPrice: product.listPrice,
          qualityDescription: product.qualityDescription ?? undefined,
          status: product.status,
          notes: product.notes ?? undefined,
        }}
        onSubmit={async (data) => { await updateMutation.mutateAsync(data); }}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
