'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, photosApi, salesApi } from '@/lib/api';
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils';
import { ArrowLeft, Edit, ShoppingCart, QrCode, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import PhotoUploader from '@/components/products/PhotoUploader';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = parseInt(id as string);

  const { data, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
  });

  const handleDelete = () => {
    if (confirm('確定要刪除此商品嗎？此操作無法還原。')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-white rounded-xl h-96" />;
  }

  const product = data?.data;
  if (!product) return <div className="text-red-500">商品不存在</div>;

  const primaryPhoto = product.photos.find((p) => p.isPrimary) ?? product.photos[0];
  const profit = parseFloat(product.listPrice) - parseFloat(product.costPrice);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* 頂部列 */}
      <div className="flex items-center gap-3">
        <Link href="/products" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{product.name}</h1>
        <div className="flex gap-2">
          {product.status !== 'sold' && (
            <Link
              href={`/sales/new?productId=${product.id}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <ShoppingCart className="w-4 h-4" />
              記錄銷售
            </Link>
          )}
          <Link
            href={`/products/${product.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            編輯
          </Link>
        </div>
      </div>

      {/* 主相片 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="aspect-video bg-gray-100 relative">
          {primaryPhoto ? (
            <img
              src={photosApi.url(primaryPhoto.filename)}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
              💎
            </div>
          )}
          <span
            className={cn(
              'absolute top-3 right-3 text-sm px-3 py-1 rounded-full font-medium',
              STATUS_COLORS[product.status]
            )}
          >
            {STATUS_LABELS[product.status]}
          </span>
        </div>
      </div>

      {/* 規格資訊 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{product.name}</h2>
            {product.category && (
              <p className="text-sm text-purple-600 mt-0.5">{product.category.name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">進貨價（成本）</p>
            <p className="text-base font-bold text-gray-700 mt-0.5">{formatCurrency(product.costPrice)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">標售價</p>
            <p className="text-base font-bold text-purple-700 mt-0.5">{formatCurrency(product.listPrice)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 col-span-2">
            <p className="text-xs text-gray-400">預估毛利</p>
            <p className={`text-base font-bold mt-0.5 ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(profit)}
            </p>
          </div>
        </div>

        {(product.weightG || product.lengthMm) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {product.weightG && (
              <div>
                <p className="text-xs text-gray-400">重量</p>
                <p className="text-sm font-medium text-gray-900">{product.weightG}g</p>
              </div>
            )}
            {product.lengthMm && (
              <div>
                <p className="text-xs text-gray-400">長度</p>
                <p className="text-sm font-medium text-gray-900">{product.lengthMm}mm</p>
              </div>
            )}
            {product.widthMm && (
              <div>
                <p className="text-xs text-gray-400">寬度</p>
                <p className="text-sm font-medium text-gray-900">{product.widthMm}mm</p>
              </div>
            )}
            {product.heightMm && (
              <div>
                <p className="text-xs text-gray-400">高度</p>
                <p className="text-sm font-medium text-gray-900">{product.heightMm}mm</p>
              </div>
            )}
          </div>
        )}

        {product.qualityDescription && (
          <div>
            <p className="text-xs text-gray-400 mb-1">品相描述</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{product.qualityDescription}</p>
          </div>
        )}

        {product.notes && (
          <div>
            <p className="text-xs text-gray-400 mb-1">備註</p>
            <p className="text-sm text-gray-700">{product.notes}</p>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Code
          </h2>
          <a
            href={productsApi.qrUrl(product.id)}
            download={`qr-${product.sku}.png`}
            className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700"
          >
            <Download className="w-4 h-4" />
            下載
          </a>
        </div>
        <img
          src={productsApi.qrUrl(product.id)}
          alt="QR Code"
          className="w-32 h-32 mx-auto"
        />
        <p className="text-xs text-gray-400 text-center mt-2">掃描查看此商品詳情</p>
      </div>

      {/* 相片管理 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">相片管理</h2>
        <PhotoUploader productId={product.id} photos={product.photos} />
      </div>

      {/* 危險區域 */}
      {product.status === 'in_stock' && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h2 className="font-semibold text-red-700 mb-2">刪除商品</h2>
          <p className="text-sm text-gray-500 mb-3">此操作無法還原，請確認再執行。</p>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            刪除此商品
          </button>
        </div>
      )}
    </div>
  );
}
