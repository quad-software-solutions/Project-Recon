import { useState, useEffect, useCallback } from 'react';
import { listProducts } from '../api/productApi';
import type { Product, ProductFilters } from '@/domains/store/model/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});

  const fetchProducts = useCallback(async (currentFilters: ProductFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await listProducts(currentFilters);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [fetchProducts, filters]);

  return { products, loading, error, filters, setFilters };
}

export default useProducts;
