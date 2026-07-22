import { http } from '@/shared/api/http';
import { unwrapList } from '@/shared/api/pagination';
import type { ProductCategory } from '../../model/types';

const BASE = '/store/categories';

export async function listActiveCategories(): Promise<ProductCategory[]> {
  return unwrapList(await http.get<ProductCategory[]>(`${BASE}/`, { params: { is_active: 'true' } }));
}

export async function getCategory(id: string): Promise<ProductCategory> {
  return await http.get<ProductCategory>(`${BASE}/${id}/`);
}
