import { http } from '../../../../shared/api/http';
import type { CmsPartnerResponse, NewsArticleResponse } from '../../shared/api/cmsApi';

export type { CmsPartnerResponse, NewsArticleResponse };

export interface HeroBannerResponse {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  video_url: string | null;
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
  /** Backend field name */
  description: string;
  /** Alias for UI components that expect `content` */
  content?: string;
  image: string | null;
  mission: string;
  vision: string;
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
  order?: number;
}

export interface GalleryItemResponse {
  id: string;
  title: string;
  description: string;
  image: string | null;
  video_url: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformStats {
  students_trained: number;
  program_tracks: number;
  partner_schools: number;
  countries_reached: number;
}

export interface HomepageStats {
  future_engineers: number;
  programs: number;
  competitions: number;
  mission: { current: number; target: number; percentage: number };
}

export const cmsPublicApi = {
  getPlatformStats: (signal?: AbortSignal) => http.get<PlatformStats>('/cms/stats/', { signal }),
  getHomepageStats: (signal?: AbortSignal) => http.get<HomepageStats>('/public/homepage/statistics/', { signal }),
  getHeroBanners: (signal?: AbortSignal) => http.get<HeroBannerResponse[]>('/cms/hero-banners/', { signal }),
  getNews: (params?: Record<string, string>, signal?: AbortSignal) => http.get<PaginatedResponse<NewsArticleResponse>>('/cms/news/', { params, signal }),
  getNewsDetail: (slug: string) => http.get<NewsArticleResponse>(`/cms/news/${slug}/`),
  getPartners: (signal?: AbortSignal) => http.get<CmsPartnerResponse[]>('/cms/partners/', { signal }),
  getAboutUs: async () => {
    const rows = await http.get<AboutUsResponse[]>('/cms/about/');
    return (Array.isArray(rows) ? rows : []).map(row => ({
      ...row,
      content: row.description,
    }));
  },
  getAboutUsDetail: async (slug: string) => {
    const row = await http.get<AboutUsResponse>(`/cms/about/${slug}/`);
    return { ...row, content: row.description, image: row.image ?? '' };
  },
  getGallery: async (signal?: AbortSignal) => {
    const res = await http.get<GalleryItemResponse[] | { results: GalleryItemResponse[] }>('/cms/gallery/', { signal });
    return Array.isArray(res) ? res : (res.results ?? []);
  },
  getGalleryDetail: (id: string) => http.get<GalleryItemResponse>(`/cms/gallery/${id}/`),
  getMapNodes: () => http.get<MapNodeResponse[]>('/cms/map-nodes/'),
  /** No backend endpoint — returns empty list for compatibility */
  getTeamMembers: async () => [] as TeamMemberResponse[],
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
