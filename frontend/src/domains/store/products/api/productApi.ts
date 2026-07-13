import { http } from '@/src/shared/api/http';
import type { Product, ProductFilters } from '@/src/domains/store/model/types';

const BASE = '/store/products';

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters?.category_id) params.category_id = filters.category_id;
  if (filters?.search) params.search = filters.search;
  if (filters?.min_price !== undefined) params.min_price = String(filters.min_price);
  if (filters?.max_price !== undefined) params.max_price = String(filters.max_price);
  if (filters?.sort_by) params.sort_by = filters.sort_by;
  return await http.get<Product[]>(`${BASE}/`, { params });
}

export async function getProduct(id: string): Promise<Product> {
  return await http.get<Product>(`${BASE}/${id}/`);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  // TODO: Check if backend has slug endpoint or we need to filter
  // For now, just use getProduct, assuming id is slug (but adjust as needed)
  return await http.get<Product>(`${BASE}/${slug}/`);
}

