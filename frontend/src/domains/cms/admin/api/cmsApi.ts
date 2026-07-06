import { http } from '@/src/shared/api/http';
import type {
  HeroBanner as ModelHeroBanner,
  NewsArticle,
  CmsPartner as ModelPartner,
  AboutUs as ModelAboutUs,
  ContactRequest as ModelContactRequest,
  FAQ,
} from '../model';

export type HeroBanner = ModelHeroBanner;
export type News = NewsArticle;
export type Partner = ModelPartner;
export type AboutUs = ModelAboutUs;
export type ContactRequest = ModelContactRequest;
export type Faq = FAQ;

const PREFIX = '/cms/admin';

const STATUS_TO_BACKEND: Record<string, string> = {
  pending: 'OPEN',
  resolved: 'RESOLVED',
  archived: 'CLOSED',
};

const STATUS_TO_UI: Record<string, string> = {
  OPEN: 'pending',
  IN_PROGRESS: 'pending',
  RESOLVED: 'resolved',
  CLOSED: 'archived',
};

function withUiAliases<T>(endpoint: string, item: T): T {
  const record = item as Record<string, unknown>;
  if (endpoint === 'hero-banners') {
    record.imageUrl = record.image;
    record.linkUrl = record.button_url;
    record.isActive = record.is_active;
    record.priority = 0;
  }
  if (endpoint === 'news') {
    record.subtitle = record.summary;
    record.imageUrl = record.image;
    record.category = record.type;
    record.publishedAt = record.published_at;
    record.isActive = record.is_active;
  }
  if (endpoint === 'partners') {
    record.name = record.title;
    record.logoUrl = record.image;
    record.websiteUrl = record.website_url;
    record.isActive = record.is_active;
    record.priority = 0;
  }
  if (endpoint === 'about') {
    record.content = record.description;
    record.isActive = record.is_active;
  }
  if (endpoint === 'faqs') {
    record.isActive = record.is_active;
    record.priority = 0;
  }
  if (endpoint === 'contact-requests') {
    record.message = record.description;
    record.createdAt = record.created_at;
    if (typeof record.status === 'string') {
      record.status = STATUS_TO_UI[record.status] ?? record.status.toLowerCase();
    }
  }
  return item;
}

function toBackendPayload(endpoint: string, data: unknown): Record<string, unknown> {
  const source = (data ?? {}) as Record<string, unknown>;

  if (endpoint === 'hero-banners') {
    return {
      title: source.title,
      subtitle: source.subtitle,
      description: source.description,
      image: source.imageUrl ?? source.image ?? null,
      button_url: source.linkUrl ?? source.button_url ?? null,
      button_text: source.button_text ?? null,
      video_url: source.video_url ?? null,
      is_active: source.isActive ?? source.is_active ?? true,
    };
  }

  if (endpoint === 'news') {
    return {
      title: source.title,
      slug: source.slug || String(source.title ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      summary: source.subtitle ?? source.summary ?? '',
      content: source.content ?? '',
      image: source.imageUrl ?? source.image ?? null,
      video_url: source.video_url ?? null,
      button_text: source.button_text ?? null,
      button_url: source.button_url ?? null,
      type: source.category === 'ANNOUNCEMENT' ? 'ANNOUNCEMENT' : source.type ?? 'NEWS',
      is_active: source.isActive ?? source.is_active ?? true,
      published_at: source.publishedAt ?? source.published_at ?? null,
    };
  }

  if (endpoint === 'partners') {
    return {
      title: source.name ?? source.title,
      description: source.description ?? '',
      image: source.logoUrl ?? source.image ?? null,
      website_url: source.websiteUrl ?? source.website_url ?? null,
      type: source.type ?? 'PARTNER',
      is_active: source.isActive ?? source.is_active ?? true,
    };
  }

  if (endpoint === 'about') {
    return {
      title: source.title,
      slug: source.slug || String(source.title ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: source.content ?? source.description ?? '',
      is_active: source.isActive ?? source.is_active ?? true,
    };
  }

  if (endpoint === 'faqs') {
    return {
      question: source.question,
      answer: source.answer,
      is_active: source.isActive ?? source.is_active ?? true,
    };
  }

  if (endpoint === 'contact-requests') {
    return {
      status: typeof source.status === 'string' ? STATUS_TO_BACKEND[source.status] ?? source.status : source.status,
      priority: source.priority,
    };
  }

  return source;
}

export const api = {
  getAll: async <T>(endpoint: string): Promise<T[]> => {
    const res = await http.get<{ results: T[] }>(`${PREFIX}/${endpoint}/`);
    return res.results.map(item => withUiAliases(endpoint, item));
  },
  create: async (endpoint: string, data: unknown) => {
    return http.post(`${PREFIX}/${endpoint}/`, toBackendPayload(endpoint, data));
  },
  update: async (endpoint: string, id: number | string, data: unknown) => {
    return http.patch(`${PREFIX}/${endpoint}/${id}/`, toBackendPayload(endpoint, data));
  },
  delete: async (endpoint: string, id: number | string) => {
    return http.delete(`${PREFIX}/${endpoint}/${id}/`);
  },
};
