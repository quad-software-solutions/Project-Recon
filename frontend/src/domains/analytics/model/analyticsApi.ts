import { http } from '../../../shared/api/http';
import type { AnalyticsData } from '../../../shared/types';

export async function getAnalytics(): Promise<AnalyticsData> {
  const res = await http.get<AnalyticsData>('/analytics/dashboard/');
  return res;
}
