import { supabase } from '@/lib/supabase';
import type {
  ServiceFilters,
  ServiceWithDetails,
  ServiceWithProvider,
  ProviderWithServices,
} from '@/types/service.types';
import type { ServiceRow } from '@/types/database.types';
import {
  type IServiceRepository,
  serviceRepository,
} from '@/repositories/service.repository';

export class ServiceDiscoveryFacade {
  constructor(private readonly repo: IServiceRepository) {}

  async getFeatured(): Promise<ServiceWithProvider[]> {
    return this.repo.findFeatured();
  }

  async getAll(
    filters: ServiceFilters,
  ): Promise<{ data: ServiceWithProvider[]; count: number }> {
    return this.repo.findAll(filters);
  }

  async search(query: string, category?: string | null): Promise<ServiceWithProvider[]> {
    if (!query.trim()) {
      const result = await this.repo.findAll({ sortBy: 'relevance', page: 1 });
      return result.data;
    }
    return this.repo.search(query.trim(), category);
  }

  async getByCategory(
    category: string,
    page = 1,
  ): Promise<{ data: ServiceWithProvider[]; count: number }> {
    return this.repo.findAll({ category, sortBy: 'relevance', page });
  }

  async getServiceDetail(id: string): Promise<ServiceWithDetails | null> {
    return this.repo.findById(id);
  }

  async getProviderProfile(providerId: string): Promise<ProviderWithServices | null> {
    return this.repo.getProviderWithServices(providerId);
  }

  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm = 25,
  ): Promise<ServiceWithProvider[]> {
    const { data, error } = await supabase.rpc('find_nearby_services', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
    });

    if (error) throw new Error(`ServiceDiscoveryFacade.getNearby: ${error.message}`);

    const rows = (data ?? []) as ServiceRow[];
    if (rows.length === 0) return [];

    const providerIds = [...new Set(rows.map((r) => r.provider_id))];
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, profile_image_url, is_verified')
      .in('id', providerIds);

    const userMap = new Map(((usersData ?? []) as Array<{
      id: string;
      name: string;
      profile_image_url: string | null;
      is_verified: boolean;
    }>).map((u) => [u.id, u]));

    return rows.map((row) => ({
      ...row,
      provider: userMap.get(row.provider_id) ?? {
        id: row.provider_id,
        name: 'Unknown',
        profile_image_url: null,
        is_verified: false,
      },
    }));
  }
}

export const serviceDiscoveryFacade = new ServiceDiscoveryFacade(serviceRepository);
