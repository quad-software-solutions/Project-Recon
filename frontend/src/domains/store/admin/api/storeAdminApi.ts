import { http } from '@/shared/api/http';
import type {
  ProductCategory, Product, BranchInventory, Order,
} from '@/domains/store/model/types';

const PREFIX = '/store/admin';

export interface CategoryPayload {
  name: string;
  description: string;
  is_active: boolean;
}

export interface ProductPayload {
  category: string;
  name: string;
  short_description: string;
  description: string;
  sku: string;
  barcode: string;
  price: number;
  weight: number;
  is_active: boolean;
}

export interface InventoryPayload {
  branch: string;
  product: string;
  quantity: number;
  minimum_quantity: number;
}

export interface OrderStatusPayload {
  status: string;
  notes?: string;
}



export interface InventoryAdjustPayload {
  quantity: number;
}

export interface InventoryCorrectPayload {
  quantity: number;
}

export interface InventoryTransferPayload {
  from_branch: string;
  to_branch: string;
  product: string;
  quantity: number;
}

export interface ProductStatsReport {
  summary: {
    total_products: number;
    active_products: number;
    archived_products: number;
  };
  price_stats: { min: number; max: number; avg: number };
  by_category: Array<{
    id: string;
    name: string;
    is_active: boolean;
    total_products: number;
    active_products: number;
    archived_products: number;
  }>;
}

export interface SalesReportRow {
  period: string | null;
  order_count: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface LowStockReportRow {
  branch_id: string;
  branch_name: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  minimum_quantity: number;
}

export interface OrderReportRow {
  period: string | null;
  order_count: number;
  total_value?: number;
}

export const storeAdminApi = {
  categories: {
    list: () => http.get<ProductCategory[]>(`${PREFIX}/categories/`),
    get: (id: string) => http.get<ProductCategory>(`${PREFIX}/categories/${id}/`),
    create: (data: CategoryPayload) => http.post<ProductCategory>(`${PREFIX}/categories/`, data),
    update: (id: string, data: Partial<CategoryPayload>) => http.patch<ProductCategory>(`${PREFIX}/categories/${id}/`, data),
    delete: (id: string) => http.delete<void>(`${PREFIX}/categories/${id}/`),
    activate: (id: string) => http.post<void>(`${PREFIX}/categories/${id}/activate/`, {}),
    deactivate: (id: string) => http.post<void>(`${PREFIX}/categories/${id}/deactivate/`, {}),
  },

  products: {
    list: (params?: Record<string, string>) => http.get<Product[]>(`${PREFIX}/products/`, { params }),
    get: (id: string) => http.get<Product>(`${PREFIX}/products/${id}/`),
    create: (data: ProductPayload) => {
      const payload = { ...data } as Record<string, unknown>;
      if (!payload.slug && data.name) {
        payload.slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return http.post<Product>(`${PREFIX}/products/`, payload);
    },
    update: (id: string, data: Partial<ProductPayload>) => http.put<Product>(`${PREFIX}/products/${id}/`, data),
    delete: (id: string) => http.delete<void>(`${PREFIX}/products/${id}/`),
    archive: (id: string) => http.post<void>(`${PREFIX}/products/${id}/archive/`, {}),
    restore: (id: string) => http.post<void>(`${PREFIX}/products/${id}/restore/`, {}),
    activate: (id: string) => http.post<void>(`${PREFIX}/products/${id}/activate/`, {}),
    deactivate: (id: string) => http.post<void>(`${PREFIX}/products/${id}/deactivate/`, {}),
    uploadImage: (productId: string, formData: FormData) =>
      http.post<Product>(`${PREFIX}/products/${productId}/images/`, formData),
    deleteImage: (imageId: string) =>
      http.delete<void>(`/store/admin/product-images/${imageId}/`),
    setPrimaryImage: (imageId: string) =>
      http.post<void>(`/store/admin/product-images/${imageId}/set-primary/`, {}),
  },

  inventory: {
    list: (params?: Record<string, string>) => http.get<BranchInventory[]>(`${PREFIX}/inventory/`, { params }),
    create: (data: InventoryPayload) => http.post<BranchInventory>(`${PREFIX}/inventory/`, data),
    adjust: (id: string, data: InventoryAdjustPayload) => http.post<BranchInventory>(`${PREFIX}/inventory/${id}/add/`, data),
    reduce: (id: string, data: InventoryAdjustPayload) => http.post<BranchInventory>(`${PREFIX}/inventory/${id}/reduce/`, data),
    correct: (id: string, data: InventoryCorrectPayload) => http.post<BranchInventory>(`${PREFIX}/inventory/${id}/correct/`, data),
    transfer: (data: InventoryTransferPayload) => http.post<BranchInventory>(`${PREFIX}/inventory/transfer/`, data),
  },

  orders: {
    list: (params?: Record<string, string>) => http.get<Order[]>(`${PREFIX}/orders/`, { params }),
    get: (id: string) => http.get<Order>(`${PREFIX}/orders/${id}/`),
    updateStatus: (id: string, data: OrderStatusPayload) =>
      http.post<Order>(`${PREFIX}/orders/${id}/status/`, data),
  },

  reports: {
    products: () => http.get<ProductStatsReport>(`${PREFIX}/reports/products/`),
    sales: (params?: Record<string, string>) =>
      http.get<SalesReportRow[]>(`${PREFIX}/reports/sales/`, { params }),
    lowStock: () => http.get<LowStockReportRow[]>(`${PREFIX}/reports/low-stock/`),
    orders: (params?: Record<string, string>) =>
      http.get<OrderReportRow[]>(`${PREFIX}/reports/orders/`, { params }),
  },
};
