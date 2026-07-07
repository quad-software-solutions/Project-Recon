import { http } from '@/src/shared/api/http';

const PREFIX = '/cms/admin';

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  priority: number;
}

export interface News {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  author: string;
  imageUrl: string;
  category: string;
  tags: string;
  publishedAt: string;
  isActive: boolean;
}

export interface ContactRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'archived';
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
  isActive: boolean;
}

export interface AboutUs {
  id: number;
  title: string;
  content: string;
  mission: string;
  vision: string;
  imageUrl: string;
  isActive: boolean;
}

export interface Partner {
  id: number;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  description: string;
  isActive: boolean;
  priority: number;
}

export const api = {
  getAll: async <T>(endpoint: string): Promise<T[]> => {
    const res = await http.get<{ results: T[] }>(`${PREFIX}/${endpoint}/`);
    return res.results ?? (res as unknown as T[]);
  },
  create: async <T>(endpoint: string, data: Partial<T>): Promise<T> =>
    http.post<T>(`${PREFIX}/${endpoint}/`, data),
  update: async <T>(endpoint: string, id: number | string, data: Partial<T>): Promise<T> =>
    http.put<T>(`${PREFIX}/${endpoint}/${id}/`, data),
  delete: async (endpoint: string, id: number | string): Promise<void> =>
    http.delete<void>(`${PREFIX}/${endpoint}/${id}/`),
};
