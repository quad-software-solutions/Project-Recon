import { http } from '../../../../shared/api/http';
import type { CmsPartnerResponse, NewsArticleResponse } from '../../shared/api/cmsApi';

export type { CmsPartnerResponse, NewsArticleResponse };

export interface HeroBannerResponse {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  button_text: string | null;
  button_url: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
}

export interface FaqResponse {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_active: boolean;
}

export interface AboutUsResponse {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  order: number;
  is_active: boolean;
}

export interface MapNodeResponse {
  id: string;
  city: string;
  country: string;
  title: string;
  achievement: string;
  x: number;
  y: number;
  lat: string;
  lng: string;
  image: string;
  category: string;
  is_active: boolean;
}

export interface TeamMemberResponse {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  is_active: boolean;
}

export const cmsPublicApi = {
  getHeroBanners: (signal?: AbortSignal) => http.get<HeroBannerResponse[]>('/cms/hero-banners/', { signal }),
  getNews: (params?: Record<string, string>, signal?: AbortSignal) => http.get<PaginatedResponse<NewsArticleResponse>>('/cms/news/', { params, signal }),
  getNewsDetail: (slug: string) => http.get<NewsArticleResponse>(`/cms/news/${slug}/`),
  getPartners: (signal?: AbortSignal) => http.get<CmsPartnerResponse[]>('/cms/partners/', { signal }),
  getAboutUs: () => http.get<AboutUsResponse[]>('/cms/about/'),
  getAboutUsDetail: (slug: string) => http.get<AboutUsResponse>(`/cms/about/${slug}/`),
  getMapNodes: () => http.get<MapNodeResponse[]>('/cms/map-nodes/'),
  getTeamMembers: () => http.get<TeamMemberResponse[]>('/cms/team-members/'),
  getFaqs: async (signal?: AbortSignal) => {
    const res = await http.get<FaqResponse[] | { results: FaqResponse[] }>('/cms/faqs/', { signal });
    return Array.isArray(res) ? res : (res.results ?? []);
  },
  submitContactRequest: (data: { name: string; email: string; subject?: string; description: string }) => 
    http.post('/cms/contact-requests/', data),
};

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
