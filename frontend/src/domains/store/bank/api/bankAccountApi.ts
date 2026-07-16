import { http } from '@/shared/api/http';
import type { BankAccount } from '@/domains/store/model/types';

export async function listBankAccounts(): Promise<BankAccount[]> {
  return await http.get<BankAccount[]>('/bank-accounts/');
}