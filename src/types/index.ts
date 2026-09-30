// User & Auth Types
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: string;
  organization_id: string | null;
  is_active: boolean;
  email_verified: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
  role: Role;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: string;
  organization_id?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Organization & Plant Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  is_active: boolean;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Plant {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  location: string | null;
  timezone: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Tour & Stop Types
export interface Tour {
  id: string;
  plant_id: string;
  title: string;
  description: string | null;
  slug: string;
  is_active: boolean;
  is_public: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Stop {
  id: string;
  tour_id: string;
  order_index: number;
  title_translations: Record<string, string>;
  description_translations: Record<string, string>;
  image_url: string | null;
  video_url: string | null;
  audio_urls: Record<string, string>;
  qr_code_url: string | null;
  qr_short_code: string;
  metadata: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface ApiError {
  error: string;
  message: string;
  details?: any[];
}
