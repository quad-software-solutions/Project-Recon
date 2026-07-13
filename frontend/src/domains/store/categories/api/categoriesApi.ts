import { http } from '@/src/shared/api/http';
import type { ProductCategory } from '@/src/domains/store/model/types';

export async function listActiveCategories(): Promise<ProductCategory[]> {
  return await http.get<ProductCategory[]>('/store/categories/');
}

export async function getCategory(id: string): Promise<ProductCategory> {
  return await http.get<ProductCategory>(`/store/categories/${id}/`);
}
