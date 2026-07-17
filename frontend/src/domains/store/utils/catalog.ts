import type { Product } from '@/domains/store/model/types';

export type CatalogSort = 'newest' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export interface CatalogQuery {
  categoryId?: string;
  search?: string;
  sort?: CatalogSort;
}

export function filterAndSortProducts(
  products: Product[],
  query: CatalogQuery = {},
): Product[] {
  const search = (query.search || '').trim().toLowerCase();
  let result = products.filter((product) => {
    if (query.categoryId && product.category !== query.categoryId) return false;
    if (!search) return true;
    return (
      product.name.toLowerCase().includes(search) ||
      product.short_description?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.category_name?.toLowerCase().includes(search)
    );
  });

  const sort = query.sort || 'newest';
  result = [...result].sort((a, b) => {
    switch (sort) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return Number(a.price) - Number(b.price);
      case 'price-desc':
        return Number(b.price) - Number(a.price);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return result;
}

export function recentlyAdded(products: Product[], limit = 8): Product[] {
  return filterAndSortProducts(products, { sort: 'newest' }).slice(0, limit);
}

export function relatedProducts(products: Product[], product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

export function paginate<T>(items: T[], page: number, pageSize: number): {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
  };
}

/** Parse store deep-link paths under /store */
export type StoreView =
  | { kind: 'home' }
  | { kind: 'category'; categoryId: string }
  | { kind: 'product'; productId: string }
  | { kind: 'pending-order'; orderId: string };

export function parseStorePath(pathname: string): StoreView {
  const pendingMatch = pathname.match(/^\/store\/pending-orders\/([^/]+)\/?$/);
  if (pendingMatch) return { kind: 'pending-order', orderId: decodeURIComponent(pendingMatch[1]) };
  const productMatch = pathname.match(/^\/store\/products\/([^/]+)\/?$/);
  if (productMatch) return { kind: 'product', productId: decodeURIComponent(productMatch[1]) };
  const categoryMatch = pathname.match(/^\/store\/categories\/([^/]+)\/?$/);
  if (categoryMatch) return { kind: 'category', categoryId: decodeURIComponent(categoryMatch[1]) };
  return { kind: 'home' };
}

export function storeProductPath(productId: string): string {
  return `/store/products/${productId}`;
}

export function storeCategoryPath(categoryId: string): string {
  return `/store/categories/${categoryId}`;
}

export function storePendingOrderPath(orderId: string): string {
  return `/store/pending-orders/${orderId}`;
}

export function navigateStore(path: string) {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
