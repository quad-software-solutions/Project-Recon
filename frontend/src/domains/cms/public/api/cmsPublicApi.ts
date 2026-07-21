import { http } from '../../../../shared/api/http';
import { unwrapList, fetchAllPages, type PaginatedResponse } from '@/shared/api/pagination';
import { resolveMediaUrl } from '@/shared/utils/media';
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
  getHomepageStats: async (signal?: AbortSignal) => {
    try {
      return await http.get<HomepageStats>('/cms/homepage/statistics/current/', { signal });
    } catch {
      // Fallback if /current/ fails (e.g. legacy multi-row collision): use newest from list
      const rows = unwrapList(
        await http.get<HomepageStats[] | PaginatedResponse<HomepageStats>>('/cms/homepage/statistics/', {
          signal,
          params: { page_size: '1' },
        }),
      );
      if (!rows[0]) throw new Error('Homepage statistics unavailable');
      return rows[0];
    }
  },
  getHeroBanners: async (signal?: AbortSignal) => {
    const banners = await fetchAllPages<HeroBannerResponse>((page) =>
      http.get<PaginatedResponse<HeroBannerResponse> | HeroBannerResponse[]>(
        '/cms/hero-banners/',
        { signal, params: { page: String(page), page_size: '50' } },
      ),
    );
    return banners.map(banner => ({ ...banner, image: resolveMediaUrl(banner.image) || '' }));
  },
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
  getGallery: async (signal?: AbortSignal) => {
    const items = unwrapList(await http.get<GalleryItemResponse[] | PaginatedResponse<GalleryItemResponse>>('/cms/gallery/', { signal }));
    return items.map(item => ({
      ...item,
      image: item.image ? resolveMediaUrl(item.image) : null,
      video_url: item.video_url ? resolveMediaUrl(item.video_url) : null,
    }));
  },
  getGalleryDetail: async (id: string) => {
    const item = await http.get<GalleryItemResponse>(`/cms/gallery/${id}/`);
    return {
      ...item,
      image: item.image ? resolveMediaUrl(item.image) : null,
      video_url: item.video_url ? resolveMediaUrl(item.video_url) : null,
    };
  },
  getMapNodes: async () =>
    unwrapList(await http.get<MapNodeResponse[] | PaginatedResponse<MapNodeResponse>>('/cms/map-nodes/')),
  /** No backend endpoint — returns empty list for compatibility */
  getTeamMembers: async () => [] as TeamMemberResponse[],
  getTestimonials: async (signal?: AbortSignal) => {
    try {
      return await fetchAllPages<TestimonialResponse>(
        (page) =>
          http.get<PaginatedResponse<TestimonialResponse> | TestimonialResponse[]>(
            '/cms/testimonials/',
            { signal, params: { page: String(page), page_size: '100' } },
          ),
      );
    } catch {
      return [] as TestimonialResponse[];
    }
  },
  getFaqs: async (signal?: AbortSignal) =>
    unwrapList(await http.get<FaqResponse[] | PaginatedResponse<FaqResponse>>('/cms/faqs/', { signal })),
  submitContactRequest: (data: { name: string; email: string; subject?: string; description: string }) => 
    http.post('/cms/contact-requests/', data),
};
