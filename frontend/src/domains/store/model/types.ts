export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  image: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category: string;
  category_name: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  sku: string;
  barcode: string;
  price: number;
  weight: number;
  is_active: boolean;
  archived_at?: string | null;
  images: ProductImage[];
  primary_image: ProductImage | null;
  created_at: string;
  updated_at: string;
}

export interface ProductBrief {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  category_name: string;
}

export interface BranchInventory {
  id: string;
  branch: string;
  branch_name: string;
  product: string;
  product_name?: string;
  product_slug?: string;
  product_sku?: string;
  product_detail?: ProductBrief;
  quantity: number;
  minimum_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingCartItem {
  id: string;
  product: string;
  product_name: string;
  product_slug: string;
  product_price: number;
  branch: string;
  branch_name: string;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface ShoppingCart {
  id: string;
  items: ShoppingCartItem[];
  total: number;
  item_count: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CartAddPayload {
  product: string;
  branch: string;
  quantity: number;
}

export interface CheckoutPayload {
  branch: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

export interface PendingOrderItem {
  id: string;
  product: string;
  product_name: string;
  product_slug: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PendingOrder {
  id: string;
  branch: string;
  branch_name: string;
  payment_reference: string;
  subtotal: number;
  total: number;
  items: PendingOrderItem[];
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  expires_at: string;
  created_at: string;
}

export interface StorePayment {
  id: string;
  pending_order: string;
  amount: number;
  payment_method: string;
  payment_provider: string;
  transaction_reference: string;
  status: string;
  payment_date: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  id: string;
  previous_status: string;
  new_status: string;
  changed_by?: string;
  changed_at: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  branch: string;
  branch_name: string;
  payment_reference: string;
  subtotal: number;
  total: number;
  status: string;
  paid_at?: string;
  completed_at?: string;
  created_at: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

export interface ProductFilters {
  category_id?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
}
