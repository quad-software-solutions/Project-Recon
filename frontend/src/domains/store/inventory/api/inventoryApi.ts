import { http } from '@/shared/api/http';
import type { BranchInventory } from '../../model/types';

const BASE = '/store/inventory';

export async function getBranchInventory(branchId: string): Promise<BranchInventory[]> {
  return await http.get<BranchInventory[]>(`${BASE}/`, { params: { branch: branchId } });
}

export async function getProductAvailability(productId: string): Promise<BranchInventory[]> {
  return await http.get<BranchInventory[]>(`${BASE}/availability/${productId}/`);
}
