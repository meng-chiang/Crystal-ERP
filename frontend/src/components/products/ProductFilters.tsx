import type { ProductStatus } from '@crystal-erp/shared';

export interface ProductFilterValues {
  q: string;
  status: ProductStatus | '';
  categoryId: number | '';
  weightMin: string;
  weightMax: string;
  priceMin: string;
  priceMax: string;
}

export const DEFAULT_FILTERS: ProductFilterValues = {
  q: '',
  status: '',
  categoryId: '',
  weightMin: '',
  weightMax: '',
  priceMin: '',
  priceMax: '',
};

export function isFilterActive(filters: ProductFilterValues): boolean {
  return filters.q !== '' || filters.status !== '' || filters.categoryId !== '' ||
    filters.weightMin !== '' || filters.weightMax !== '' ||
    filters.priceMin !== '' || filters.priceMax !== '';
}
