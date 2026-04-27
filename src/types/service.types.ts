import type { UserRow, ReviewRow, ServiceRow } from './database.types';

export type SortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'distance_asc';

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}

export interface ServiceFilters {
  category?: string | null;
  sortBy: SortOption;
  page: number;
  limit?: number;
}

export type ProviderSummary = Pick<
  UserRow,
  'id' | 'name' | 'profile_image_url' | 'is_verified'
>;

export type ProviderDetail = Pick<
  UserRow,
  'id' | 'name' | 'profile_image_url' | 'is_verified' | 'phone' | 'bio' | 'address'
>;

export type ReviewWithUser = ReviewRow & {
  user: Pick<UserRow, 'name' | 'profile_image_url'>;
};

export type ServiceWithProvider = ServiceRow & {
  provider: ProviderSummary;
};

export type ServiceWithDetails = ServiceRow & {
  provider: ProviderDetail;
  reviews: ReviewWithUser[];
};

export type ProviderWithServices = ProviderDetail & {
  services: ServiceRow[];
};
