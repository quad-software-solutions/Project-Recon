import { http } from '../../../../shared/api/http';

export interface CmsPartnerResponse {
  id: string;
  title: string;
  description: string;
  image: string | null;
  website_url: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsArticleResponse {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string | null;
  video_url: string | null;
  button_text: string | null;
  button_url: string | null;
  type: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRequestResponse {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  description: string;
  attachment: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const cmsPartnersApi = {
  list: () => http.get<CmsPartnerResponse[]>('/cms/admin/partners/'),
  get: (id: string) => http.get<CmsPartnerResponse>(`/cms/admin/partners/${id}/`),
  create: (data: Partial<CmsPartnerResponse>) =>
    http.post<CmsPartnerResponse>('/cms/admin/partners/', data),
  update: (id: string, data: Partial<CmsPartnerResponse>) =>
    http.patch<CmsPartnerResponse>(`/cms/admin/partners/${id}/`, data),
  delete: (id: string) => http.delete(`/cms/admin/partners/${id}/`),
};

export const cmsNewsApi = {
  list: (params?: Record<string, string>) =>
    http.get<NewsArticleResponse[]>('/cms/admin/news/', { params }),
  get: (id: string) => http.get<NewsArticleResponse>(`/cms/admin/news/${id}/`),
  create: (data: Partial<NewsArticleResponse>) =>
    http.post<NewsArticleResponse>('/cms/admin/news/', data),
  update: (id: string, data: Partial<NewsArticleResponse>) =>
    http.patch<NewsArticleResponse>(`/cms/admin/news/${id}/`, data),
  delete: (id: string) => http.delete(`/cms/admin/news/${id}/`),
};

export const cmsContactRequestsApi = {
  list: () => http.get<ContactRequestResponse[]>('/cms/admin/contact-requests/'),
  get: (id: string) => http.get<ContactRequestResponse>(`/cms/admin/contact-requests/${id}/`),
  update: (id: string, data: Partial<ContactRequestResponse>) =>
    http.patch<ContactRequestResponse>(`/cms/admin/contact-requests/${id}/`, data),
  delete: (id: string) => http.delete(`/cms/admin/contact-requests/${id}/`),
};
