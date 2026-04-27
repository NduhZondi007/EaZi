import type {
  ServiceFilters,
  ServiceWithDetails,
  ServiceWithProvider,
  ProviderWithServices,
} from '@/types/service.types';
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
}

export const serviceDiscoveryFacade = new ServiceDiscoveryFacade(serviceRepository);
