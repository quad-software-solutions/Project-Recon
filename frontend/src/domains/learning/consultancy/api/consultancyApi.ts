import { http } from '@/src/shared/api/http';
import { MOCK_CONSULTANCY_REQUESTS } from '@/src/shared/constants/mock-data';
import type { ConsultancyRequest } from '@/src/shared/types';

const BASE = '/consultancy';

export async function getConsultancyRequests(): Promise<ConsultancyRequest[]> {
  try {
    const res = await http.get<{ results: ConsultancyRequest[] }>(`${BASE}/requests/`);
    return res.results;
  } catch {
    return MOCK_CONSULTANCY_REQUESTS;
  }
}

export async function submitConsultancyRequest(data: Omit<ConsultancyRequest, 'id' | 'status' | 'submittedDate'>): Promise<void> {
  try {
    await http.post(`${BASE}/requests/`, data);
  } catch {
    // silent fallback
  }
}
