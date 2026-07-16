import type { BranchInventory } from '@/domains/store/model/types';

/** Normalize admin inventory rows that may use nested product_detail. */
export function getInventoryProductName(row: BranchInventory): string {
  return row.product_name || row.product_detail?.name || 'Unknown product';
}

export function getInventoryProductSku(row: BranchInventory): string {
  return row.product_sku || row.product_detail?.sku || '';
}

export function getInventoryCategoryName(row: BranchInventory): string {
  return row.product_detail?.category_name || '';
}

export function isLowStock(row: BranchInventory): boolean {
  if (row.quantity <= 0) return true;
  if (row.minimum_quantity == null) return false;
  return row.quantity < row.minimum_quantity;
}

export function stockLevel(quantity: number, minimum = 0): 'out' | 'low' | 'ok' {
  if (quantity <= 0) return 'out';
  if (minimum > 0 && quantity < minimum) return 'low';
  return 'ok';
}
