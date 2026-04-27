import { supabase } from '@/lib/supabase';
import type { ServiceRow } from '@/types/database.types';
import type {
  ServiceFilters,
  ServiceWithDetails,
  ServiceWithProvider,
  ProviderDetail,
  ProviderWithServices,
} from '@/types/service.types';

const PAGE_SIZE = 8;

const SERVICE_WITH_PROVIDER_SELECT = `
  *,
  provider:users!provider_id(id, name, profile_image_url, is_verified)
` as const;

export interface IServiceRepository {
  findById(id: string): Promise<ServiceWithDetails | null>;
  findFeatured(): Promise<ServiceWithProvider[]>;
  findAll(filters: ServiceFilters): Promise<{ data: ServiceWithProvider[]; count: number }>;
  search(query: string, category?: string | null): Promise<ServiceWithProvider[]>;
  findByProvider(providerId: string): Promise<ServiceRow[]>;
  getProviderWithServices(providerId: string): Promise<ProviderWithServices | null>;
}

export class ServiceRepository implements IServiceRepository {
  async findById(id: string): Promise<ServiceWithDetails | null> {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        provider:users!provider_id(id, name, profile_image_url, is_verified, phone, bio, address),
        reviews(
          id, rating, comment, tipped,
          user:users!user_id(name, profile_image_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`ServiceRepository.findById: ${error.message}`);
    }
    return data as unknown as ServiceWithDetails;
  }

  async findFeatured(): Promise<ServiceWithProvider[]> {
    const { data, error } = await supabase
      .from('services')
      .select(SERVICE_WITH_PROVIDER_SELECT)
      .eq('is_featured', true)
      .eq('is_available', true)
      .order('avg_rating', { ascending: false })
      .limit(8);

    if (error) throw new Error(`ServiceRepository.findFeatured: ${error.message}`);
    return (data ?? []) as unknown as ServiceWithProvider[];
  }

  async findAll(
    filters: ServiceFilters,
  ): Promise<{ data: ServiceWithProvider[]; count: number }> {
    const limit = filters.limit ?? PAGE_SIZE;
    const from = (filters.page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('services')
      .select(SERVICE_WITH_PROVIDER_SELECT, { count: 'exact' })
      .eq('is_available', true);

    if (filters.category) {
      query = query.eq('service_type', filters.category);
    }

    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('base_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('base_price', { ascending: false });
        break;
      case 'rating_desc':
        query = query.order('avg_rating', { ascending: false });
        break;
      case 'distance_asc':
        // PostGIS distance sort is in Phase 12; fall back to rating
        query = query.order('avg_rating', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw new Error(`ServiceRepository.findAll: ${error.message}`);

    return {
      data: (data ?? []) as unknown as ServiceWithProvider[],
      count: count ?? 0,
    };
  }

  async search(query: string, category?: string | null): Promise<ServiceWithProvider[]> {
    const term = `%${query}%`;

    let q = supabase
      .from('services')
      .select(SERVICE_WITH_PROVIDER_SELECT)
      .eq('is_available', true)
      .or(`title.ilike.${term},description.ilike.${term},business_name.ilike.${term}`)
      .limit(20);

    if (category) {
      q = q.eq('service_type', category);
    }

    const { data, error } = await q;
    if (error) throw new Error(`ServiceRepository.search: ${error.message}`);
    return (data ?? []) as unknown as ServiceWithProvider[];
  }

  async findByProvider(providerId: string): Promise<ServiceRow[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`ServiceRepository.findByProvider: ${error.message}`);
    return data ?? [];
  }

  async getProviderWithServices(providerId: string): Promise<ProviderWithServices | null> {
    const { data: provider, error } = await supabase
      .from('users')
      .select('id, name, profile_image_url, is_verified, phone, bio, address')
      .eq('id', providerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`ServiceRepository.getProviderWithServices: ${error.message}`);
    }

    const services = await this.findByProvider(providerId);
    return { ...(provider as ProviderDetail), services };
  }
}

export const serviceRepository = new ServiceRepository();
