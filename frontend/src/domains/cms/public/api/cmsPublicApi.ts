import { http } from '../../../../shared/api/http';
import { unwrapList, type PaginatedResponse } from '@/shared/api/pagination';
import type { CmsPartnerResponse, NewsArticleResponse } from '../../shared/api/cmsApi';

export type { CmsPartnerResponse, NewsArticleResponse, PaginatedResponse };

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

export interface TestimonialResponse {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string | null;
  /** YouTube / Vimeo / direct mp4 URL */
  video_url: string | null;
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
  getHeroBanners: async (signal?: AbortSignal) =>
    unwrapList(await http.get<HeroBannerResponse[] | PaginatedResponse<HeroBannerResponse>>('/cms/hero-banners/', { signal })),
  getNews: (params?: Record<string, string>, signal?: AbortSignal) => http.get<PaginatedResponse<NewsArticleResponse>>('/cms/news/', { params, signal }),
  getNewsDetail: (slug: string) => http.get<NewsArticleResponse>(`/cms/news/${slug}/`),
  getPartners: async (signal?: AbortSignal) =>
    unwrapList(await http.get<CmsPartnerResponse[] | PaginatedResponse<CmsPartnerResponse>>('/cms/partners/', { signal })),
  getAboutUs: async () => {
    const rows = unwrapList(await http.get<AboutUsResponse[] | PaginatedResponse<AboutUsResponse>>('/cms/about/'));
    return rows.map(row => ({
      ...row,
      content: row.description,
    }));
  },
  getAboutUsDetail: async (slug: string) => {
    const row = await http.get<AboutUsResponse>(`/cms/about/${slug}/`);
    return { ...row, content: row.description, image: row.image ?? '' };
  },
  getGallery: async (signal?: AbortSignal) =>
    unwrapList(await http.get<GalleryItemResponse[] | PaginatedResponse<GalleryItemResponse>>('/cms/gallery/', { signal })),
  getGalleryDetail: (id: string) => http.get<GalleryItemResponse>(`/cms/gallery/${id}/`),
  getMapNodes: async () =>
    unwrapList(await http.get<MapNodeResponse[] | PaginatedResponse<MapNodeResponse>>('/cms/map-nodes/')),
  /** No backend endpoint — returns empty list for compatibility */
  getTeamMembers: async () => [] as TeamMemberResponse[],
  getTestimonials: async (signal?: AbortSignal) => {
    try {
      return unwrapList(await http.get<TestimonialResponse[] | PaginatedResponse<TestimonialResponse>>('/cms/testimonials/', { signal }));
    } catch {
      return [] as TestimonialResponse[];
    }
  },
  getFaqs: async (signal?: AbortSignal) =>
    unwrapList(await http.get<FaqResponse[] | PaginatedResponse<FaqResponse>>('/cms/faqs/', { signal })),
  submitContactRequest: (data: { name: string; email: string; subject?: string; description: string }) => 
    http.post('/cms/contact-requests/', data),
};
