import { supabase } from '@/lib/supabase';
import type { ServiceRow } from '@/types/database.types';
import type {
  ServiceFilters,
  ServiceWithDetails,
  ServiceWithProvider,
  ProviderSummary,
  ProviderDetail,
  ProviderWithServices,
} from '@/types/service.types';

const PAGE_SIZE = 8;

export interface IServiceRepository {
  findById(id: string): Promise<ServiceWithDetails | null>;
  findFeatured(): Promise<ServiceWithProvider[]>;
  findAll(filters: ServiceFilters): Promise<{ data: ServiceWithProvider[]; count: number }>;
  search(query: string, category?: string | null): Promise<ServiceWithProvider[]>;
  findByProvider(providerId: string): Promise<ServiceRow[]>;
  getProviderWithServices(providerId: string): Promise<ProviderWithServices | null>;
}

export class ServiceRepository implements IServiceRepository {
  private async attachProviders(services: ServiceRow[]): Promise<ServiceWithProvider[]> {
    if (services.length === 0) return [];

    const providerIds = [...new Set(services.map((s) => s.provider_id))];

    const { data: providers, error } = await supabase
      .from('users')
      .select('id, name, profile_image_url, is_verified')
      .in('id', providerIds);

    if (error) throw new Error(`ServiceRepository.attachProviders: ${error.message}`);

    const providerMap = new Map(
      (providers ?? []).map((p) => [p.id, p as ProviderSummary]),
    );

    return services.map((service) => ({
      ...service,
      provider: providerMap.get(service.provider_id) ?? {
        id: service.provider_id,
        name: 'Unknown Provider',
        profile_image_url: null,
        is_verified: false,
      },
    })) as ServiceWithProvider[];
  }

  async findById(id: string): Promise<ServiceWithDetails | null> {
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (serviceError) {
      if (serviceError.code === 'PGRST116') return null;
      throw new Error(`ServiceRepository.findById: ${serviceError.message}`);
    }

    const [providerResult, reviewsResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, profile_image_url, is_verified, phone, bio, address')
        .eq('id', service.provider_id)
        .single(),
      supabase
        .from('reviews')
        .select('id, booking_id, service_id, user_id, rating, comment, tipped')
        .eq('service_id', id),
    ]);

    const reviews = reviewsResult.data ?? [];
    const reviewerIds = [...new Set(reviews.map((r) => r.user_id))];
    let reviewerMap = new Map<string, { name: string; profile_image_url: string | null }>();

    if (reviewerIds.length > 0) {
      const { data: reviewers } = await supabase
        .from('users')
        .select('id, name, profile_image_url')
        .in('id', reviewerIds);

      reviewerMap = new Map(
        (reviewers ?? []).map((u) => [
          u.id,
          { name: u.name, profile_image_url: u.profile_image_url },
        ]),
      );
    }

    return {
      ...service,
      provider: (providerResult.data as ProviderDetail) ?? {
        id: service.provider_id,
        name: 'Unknown Provider',
        profile_image_url: null,
        is_verified: false,
        phone: null,
        bio: null,
        address: null,
      },
      reviews: reviews.map((r) => ({
        ...r,
        user: reviewerMap.get(r.user_id) ?? { name: 'Unknown', profile_image_url: null },
      })),
    } as unknown as ServiceWithDetails;
  }

  async findFeatured(): Promise<ServiceWithProvider[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_featured', true)
      .eq('is_available', true)
      .order('avg_rating', { ascending: false })
      .limit(8);

    if (error) throw new Error(`ServiceRepository.findFeatured: ${error.message}`);
    return this.attachProviders((data ?? []) as ServiceRow[]);
  }

  async findAll(
    filters: ServiceFilters,
  ): Promise<{ data: ServiceWithProvider[]; count: number }> {
    const limit = filters.limit ?? PAGE_SIZE;
    const from = (filters.page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('services')
      .select('*', { count: 'exact' })
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

    const services = (data ?? []) as ServiceRow[];
    const servicesWithProviders = await this.attachProviders(services);

    return {
      data: servicesWithProviders,
      count: count ?? 0,
    };
  }

  async search(query: string, category?: string | null): Promise<ServiceWithProvider[]> {
    const term = `%${query}%`;

    let q = supabase
      .from('services')
      .select('*')
      .eq('is_available', true)
      .or(`title.ilike.${term},description.ilike.${term},business_name.ilike.${term}`)
      .limit(20);

    if (category) {
      q = q.eq('service_type', category);
    }

    const { data, error } = await q;
    if (error) throw new Error(`ServiceRepository.search: ${error.message}`);
    return this.attachProviders((data ?? []) as ServiceRow[]);
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
