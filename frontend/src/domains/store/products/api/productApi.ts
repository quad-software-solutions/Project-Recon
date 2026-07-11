import { http } from '@/src/shared/api/http';
import type { Product } from '@/src/shared/types';
import type { ProductFilters } from '../model/types';

const BASE = '/store/products';

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters?.category) params.category = filters.category;
  if (filters?.search) params.search = filters.search;
  if (filters?.sortBy) params.sorting = filters.sortBy;
  const res = await http.get<Product[]>(`${BASE}/`, { params });
  return res;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return await http.get<Product>(`${BASE}/${id}/`);
}
