import { http } from '@/shared/api/http';
import type { Product, ProductFilters } from '@/domains/store/model/types';

const BASE = '/store/products';

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  return listProducts(filters);
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters?.category_id) params.category = filters.category_id;
  if (filters?.search) params.search = filters.search;
  if (filters?.sort_by) params.sorting = filters.sort_by;
  const res = await http.get<Product[]>(`${BASE}/`, { params });
  return res;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return await http.get<Product>(`${BASE}/${id}/`);
}
