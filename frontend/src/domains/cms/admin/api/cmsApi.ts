import { http } from '@/shared/api/http';
import type {
  HeroBanner as ModelHeroBanner,
  NewsArticle,
  CmsPartner as ModelPartner,
  AboutUs as ModelAboutUs,
  ContactRequest as ModelContactRequest,
  FAQ,
  GalleryItem as ModelGalleryItem,
  MapNodeModel,
  Testimonial as ModelTestimonial,
  HomepageStatistic as ModelHomepageStatistic,
} from '../model';

export type HeroBanner = ModelHeroBanner;
export type News = NewsArticle;
export type Partner = ModelPartner;
export type AboutUs = ModelAboutUs;
export type ContactRequest = ModelContactRequest;
export type Faq = FAQ;
export type GalleryItem = ModelGalleryItem;
export type MapNode = MapNodeModel;
export type Testimonial = ModelTestimonial;
export type HomepageStatistic = ModelHomepageStatistic;

const PREFIX = '/cms/admin';

const STATUS_TO_BACKEND: Record<string, string> = {
  pending: 'OPEN',
  'in-progress': 'IN_PROGRESS',
  resolved: 'RESOLVED',
  archived: 'CLOSED',
};

const STATUS_TO_UI: Record<string, string> = {
  OPEN: 'pending',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'archived',
};

function withUiAliases<T>(endpoint: string, item: T): T {
  const record = { ...item as Record<string, unknown> } as Record<string, unknown>;
  if (endpoint === 'hero-banners') {
    record.imageUrl = record.image;
    record.videoUrl = record.video_url;
    record.linkUrl = record.button_url;
    record.isActive = record.is_active;
    record.priority = record.order ?? 0;
  }
  if (endpoint === 'news') {
    record.subtitle = record.summary;
    record.imageUrl = record.image;
    record.category = record.type;
    record.publishedAt = record.published_at;
    record.author = record.author;
    record.tags = record.tags;
    record.isActive = record.is_active;
  }
  if (endpoint === 'partners') {
    record.name = record.title;
    record.logoUrl = record.image;
    record.websiteUrl = record.website_url;
    record.isActive = record.is_active;
    record.priority = record.order ?? 0;
  }
  if (endpoint === 'about') {
    record.content = record.description;
    record.imageUrl = record.image;
    record.isActive = record.is_active;
  }
  if (endpoint === 'faqs') {
    record.isActive = record.is_active;
    record.category = record.category;
    record.priority = record.order ?? 0;
  }
  if (endpoint === 'contact-requests') {
    record.message = record.description;
    record.createdAt = record.created_at;
    if (typeof record.status === 'string') {
      record.status = STATUS_TO_UI[record.status] ?? record.status.toLowerCase();
    }
  }
  if (endpoint === 'gallery') {
    record.imageUrl = record.image;
    record.videoUrl = record.video_url;
    record.isActive = record.is_active;
  }
  if (endpoint === 'map-nodes') {
    record.imageUrl = record.image;
    record.isActive = record.is_active;
  }
  if (endpoint === 'testimonials') {
    record.imageUrl = record.image;
    record.videoUrl = record.video_url;
    record.isActive = record.is_active;
    record.priority = record.order ?? 0;
  }
  return record as T;
}

function dataURItoBlob(dataURI: string): Blob {
  const [prefix, base64] = dataURI.split(',');
  const mimeString = prefix.split(':')[1].split(';')[0];
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

function toBackendPayload(endpoint: string, data: unknown): Record<string, unknown> | FormData {
  const source = (data ?? {}) as Record<string, unknown>;
  const has = (k: string) => k in source;

  interface FieldMap { [backendKey: string]: string | string[] }
  const map: Record<string, FieldMap> = {
    'hero-banners': {
      title: 'title',
      subtitle: 'subtitle',
      description: 'description',
      image: ['imageUrl', 'image'],
      button_url: ['linkUrl', 'button_url'],
      button_text: 'button_text',
      video_url: ['videoUrl', 'video_url'],
      order: 'priority',
      is_active: ['isActive', 'is_active'],
    },
    news: {
      title: 'title',
      summary: ['subtitle', 'summary'],
      content: 'content',
      image: ['imageUrl', 'image'],
      video_url: 'video_url',
      button_text: 'button_text',
      button_url: 'button_url',
      type: ['category', 'type'],
      author: 'author',
      tags: 'tags',
      is_active: ['isActive', 'is_active'],
      published_at: ['publishedAt', 'published_at'],
    },
    partners: {
      title: ['name', 'title'],
      description: 'description',
      image: ['logoUrl', 'image'],
      website_url: ['websiteUrl', 'website_url'],
      type: 'type',
      order: 'priority',
      is_active: ['isActive', 'is_active'],
    },
    about: {
      title: 'title',
      description: ['content', 'description'],
      image: 'imageUrl',
      mission: 'mission',
      vision: 'vision',
      is_active: ['isActive', 'is_active'],
    },
    faqs: {
      question: 'question',
      answer: 'answer',
      category: 'category',
      order: 'priority',
      is_active: ['isActive', 'is_active'],
    },
    'contact-requests': {
      status: 'status',
      priority: 'priority',
    },
    gallery: {
      title: 'title',
      description: 'description',
      image: ['imageUrl', 'image'],
      video_url: ['videoUrl', 'video_url'],
      category: 'category',
      is_active: ['isActive', 'is_active'],
    },
    'map-nodes': {
      city: 'city',
      country: 'country',
      title: 'title',
      achievement: 'achievement',
      x: 'x',
      y: 'y',
      lat: 'lat',
      lng: 'lng',
      image: ['imageUrl', 'image'],
      category: 'category',
      is_active: ['isActive', 'is_active'],
    },
    testimonials: {
      name: 'name',
      role: 'role',
      quote: 'quote',
      image: ['imageUrl', 'image'],
      video_url: ['videoUrl', 'video_url'],
      order: 'priority',
      is_active: ['isActive', 'is_active'],
    },
    'homepage/statistics': {
      future_engineers: 'future_engineers',
      programs: 'programs',
      competitions: 'competitions',
      mission_current: 'mission_current',
      mission_target: 'mission_target',
    },
  };

  const fieldMap = map[endpoint] ?? {};
  const result: Record<string, unknown> = {};

  for (const [backendKey, sourceKeys] of Object.entries(fieldMap)) {
    const keys = Array.isArray(sourceKeys) ? sourceKeys : [sourceKeys];
    const present = keys.some(k => has(k));
    if (!present) continue;
    let val: unknown = undefined;
    for (const k of keys) {
      if (has(k)) { val = source[k]; break; }
    }
    // Testimonials use URLField for image — send https URLs and allow null to clear.
    // Other endpoints use ImageField — skip existing https URLs so the file is unchanged.
    if (backendKey === 'image') {
      if (endpoint === 'testimonials') {
        if (val === '' || val === null || val === undefined) {
          result[backendKey] = null;
        } else {
          result[backendKey] = val;
        }
        continue;
      }
      if (!val || (typeof val === 'string' && val.startsWith('http'))) {
        continue;
      }
    }

    // Allow clearing video_url on testimonials / gallery / etc.
    if (backendKey === 'video_url' && (val === '' || val === null)) {
      result[backendKey] = null;
      continue;
    }

    result[backendKey] = val ?? null;
  }

  // normalize type for news
  if (endpoint === 'news' && result.type) {
    result.type = String(result.type).toUpperCase();
    if (!['NEWS', 'ANNOUNCEMENT'].includes(result.type as string)) {
      result.type = 'NEWS';
    }
  }

  // slug is a computed field for news and about
  if ((endpoint === 'news' || endpoint === 'about') && has('title') && !has('slug')) {
    result.slug = String(source.title ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // status conversion for contact-requests
  if (endpoint === 'contact-requests' && has('status') && typeof source.status === 'string') {
    result.status = STATUS_TO_BACKEND[source.status] ?? source.status;
  }

  // Check if we need to send FormData
  let needsFormData = false;
  for (const val of Object.values(result)) {
    if (typeof val === 'string' && val.startsWith('data:image/')) {
      needsFormData = true;
      break;
    }
    if (val instanceof File || val instanceof Blob) {
      needsFormData = true;
      break;
    }
  }

  if (needsFormData) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(result)) {
      if (typeof v === 'string' && v.startsWith('data:image/')) {
        const blob = dataURItoBlob(v);
        const ext = blob.type.split('/')[1] || 'jpg';
        fd.append(k, blob, `upload.${ext}`);
      } else if (v instanceof File || v instanceof Blob) {
        fd.append(k, v);
      } else if (v !== null && v !== undefined) {
        fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
    }
    return fd;
  }

  return result;
}

export const api = {
  getAll: async <T>(endpoint: string): Promise<T[]> => {
    const res = await http.get<{ results: T[] } | T[]>(`${PREFIX}/${endpoint}/`, {
      params: { page_size: '200' },
    });
    const items = Array.isArray(res) ? res : (res.results ?? []);
    return items.map(item => withUiAliases(endpoint, item));
  },
  create: async <T = unknown>(endpoint: string, data: unknown): Promise<T> => {
    const res = await http.post<T>(`${PREFIX}/${endpoint}/`, toBackendPayload(endpoint, data));
    return withUiAliases(endpoint, res as T);
  },
  update: async <T = unknown>(endpoint: string, id: number | string, data: unknown): Promise<T> => {
    const res = await http.patch<T>(`${PREFIX}/${endpoint}/${id}/`, toBackendPayload(endpoint, data));
    return withUiAliases(endpoint, res as T);
  },
  delete: async (endpoint: string, id: number | string) => {
    return http.delete(`${PREFIX}/${endpoint}/${id}/`);
  },
};
