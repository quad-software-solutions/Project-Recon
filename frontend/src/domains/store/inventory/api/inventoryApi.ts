import { http } from '@/src/shared/api/http';
import type { BranchInventory } from '@/src/domains/store/model/types';

export async function getBranchInventory(branchId: string): Promise<BranchInventory[]> {
  return await http.get<BranchInventory[]>('/store/inventory/', { params: { branch: branchId } });
}

export async function getProductAvailability(productId: string): Promise<BranchInventory[]> {
  return await http.get<BranchInventory[]>(`/store/inventory/availability/${productId}/`);
}
