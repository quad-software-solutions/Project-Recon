import { http } from '@/src/shared/api/http';
import type { ConsultancyRequest } from '@/src/shared/types';

const BASE = '/consultancy';

export async function getConsultancyRequests(): Promise<ConsultancyRequest[]> {
  const res = await http.get<{ results: ConsultancyRequest[] }>(`${BASE}/requests/`);
  return res.results;
}

export async function submitConsultancyRequest(data: Omit<ConsultancyRequest, 'id' | 'status' | 'submittedDate'>): Promise<void> {
  await http.post(`${BASE}/requests/`, data);
}
