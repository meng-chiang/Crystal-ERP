'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, photosApi } from '@/lib/api';
import { formatCurrency, formatDate, CHANNEL_LABELS } from '@/lib/utils';
import { TrendingUp, Package, DollarSign, BarChart3 } from 'lucide-react';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">看板總覽</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-lg">
        載入失敗，請確認後端服務是否正常運行
      </div>
    );
  }

  const stats = data?.data;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">看板總覽</h1>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="在庫商品"
          value={`${stats.totalInStock} 件`}
          subtitle={`預訂中 ${stats.totalReserved} 件`}
          icon={Package}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="在庫市值（標價）"
          value={formatCurrency(stats.totalListValue)}
          subtitle={`成本 ${formatCurrency(stats.totalCostBasis)}`}
          icon={DollarSign}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="已售件數"
          value={`${stats.totalSold} 件`}
          icon={TrendingUp}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="已實現毛利"
          value={formatCurrency(stats.realizedProfit)}
          subtitle={`收入 ${formatCurrency(stats.realizedRevenue)}`}
          icon={BarChart3}
          color={stats.realizedProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分類在庫 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">在庫分類分布</h2>
          {stats.countByCategory.length === 0 ? (
            <p className="text-gray-400 text-sm">尚無在庫商品</p>
          ) : (
            <div className="space-y-2">
              {stats.countByCategory.map((item) => (
                <div key={item.categoryName} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.categoryName}</span>
                  <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {item.count} 件
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 近期銷售 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">近期銷售（最新 10 筆）</h2>
          {stats.recentSales.length === 0 ? (
            <p className="text-gray-400 text-sm">尚無銷售紀錄</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSales.map((sale) => {
                const profit =
                  parseFloat(String(sale.salePrice)) -
                  parseFloat(String(sale.product?.costPrice ?? '0'));
                return (
                  <div key={sale.id} className="flex items-start justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{sale.product?.name}</p>
                      <p className="text-gray-400 text-xs">
                        {formatDate(String(sale.soldAt))} · {CHANNEL_LABELS[sale.channel]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(String(sale.salePrice))}</p>
                      <p className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        毛利 {formatCurrency(profit)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
