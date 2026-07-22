import { http } from '@/shared/api/http';
import { unwrapList } from '@/shared/api/pagination';
import type { BranchInventory } from '../../model/types';

const BASE = '/store/inventory';

export async function getBranchInventory(branchId: string): Promise<BranchInventory[]> {
  return unwrapList(await http.get<BranchInventory[]>(`${BASE}/`, { params: { branch: branchId } }));
}

export async function getProductAvailability(productId: string): Promise<BranchInventory[]> {
  return unwrapList(await http.get<BranchInventory[]>(`${BASE}/availability/${productId}/`));
}
