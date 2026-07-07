import { http } from '@/src/shared/api/http';
import { ROBOTICS_PRODUCTS } from '@/src/shared/constants/mock-data';
import type { Product } from '@/src/shared/types';
import type { ProductFilters } from '../model/types';

const BASE = '/store/products';

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.category) params.category = filters.category;
    if (filters?.search) params.search = filters.search;
    if (filters?.sortBy) params.sorting = filters.sortBy;
    const res = await http.get<Product[]>(`${BASE}/`, { params });
    return res;
  } catch {
    let products = [...ROBOTICS_PRODUCTS];
    if (filters) {
      if (filters.category) products = products.filter(p => p.category === filters.category);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }
      if (filters.sortBy === 'price-asc') products.sort((a, b) => a.price - b.price);
      if (filters.sortBy === 'price-desc') products.sort((a, b) => b.price - a.price);
      if (filters.sortBy === 'rating') products.sort((a, b) => b.rating - a.rating);
      if (filters.sortBy === 'name') products.sort((a, b) => a.name.localeCompare(b.name));
    }
    return products;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    return await http.get<Product>(`${BASE}/${id}/`);
  } catch {
    return ROBOTICS_PRODUCTS.find(p => p.id === id);
  }
}
