import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export const CHANNEL_LABELS: Record<string, string> = {
  line: 'LINE',
  shopee: '蝦皮',
  livestream: '直播',
  in_person: '現場',
  other: '其他',
};

export const STATUS_LABELS: Record<string, string> = {
  in_stock: '在庫',
  reserved: '預訂',
  sold: '已售出',
};

export function calculateProfit(salePrice: string | number, costPrice?: string | number | null): number {
  return parseFloat(String(salePrice)) - parseFloat(String(costPrice ?? '0'));
}

export const STATUS_COLORS: Record<string, string> = {
  in_stock: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-gray-100 text-gray-600',
};
