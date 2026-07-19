export type NewsType = 'NEWS' | 'ANNOUNCEMENT';
export type PartnerType = 'SPONSOR' | 'PARTNER';
export type ContactStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'pending' | 'resolved' | 'archived';
export type ContactPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string | null;
  video_url: string | null;
  button_text: string | null;
  button_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  priority?: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string | null;
  video_url: string | null;
  button_text: string | null;
  button_url: string | null;
  type: NewsType;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  subtitle?: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  tags?: string;
  publishedAt?: string | null;
  isActive?: boolean;
}

export interface CmsPartner {
  id: string;
  title: string;
  description: string;
  image: string | null;
  website_url: string | null;
  type: PartnerType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  name?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive?: boolean;
  priority?: number;
}

export interface AboutUs {
  id: string;
  title: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  content?: string;
  mission?: string;
  vision?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ContactRequest {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  description: string;
  attachment: string | null;
  status: ContactStatus;
  priority: ContactPriority;
  created_at: string;
  updated_at: string;
  message?: string;
  createdAt?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: string;
  priority?: number;
  isActive?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image: string | null;
  video_url: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageUrl?: string;
  videoUrl?: string | null;
  isActive?: boolean;
}

export interface MapNodeModel {
  id: string;
  city: string;
  country: string;
  title: string;
  achievement: string;
  x: number;
  y: number;
  lat: string;
  lng: string;
  image: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string | null;
  video_url: string | null;
  is_active: boolean;
  order?: number;
  created_at?: string;
  updated_at?: string;
  imageUrl?: string;
  videoUrl?: string | null;
  isActive?: boolean;
  priority?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
