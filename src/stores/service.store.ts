import { create } from 'zustand';
import type { ServiceWithProvider } from '@/types/service.types';
import type { SortOption } from '@/types/service.types';
import { serviceDiscoveryFacade } from '@/services/service-discovery.facade';

const PAGE_SIZE = 8;

interface ServiceState {
  featured: ServiceWithProvider[];
  services: ServiceWithProvider[];
  searchResults: ServiceWithProvider[];

  searchQuery: string;
  selectedCategory: string | null;
  sortBy: SortOption;

  page: number;
  totalCount: number;
  hasMore: boolean;

  isFeaturedLoading: boolean;
  isServicesLoading: boolean;
  isSearching: boolean;

  featuredError: string | null;
  servicesError: string | null;

  loadFeatured(): Promise<void>;
  loadServices(reset?: boolean): Promise<void>;
  loadMore(): Promise<void>;
  search(query: string): Promise<void>;
  setCategory(category: string | null): void;
  setSortBy(sort: SortOption): void;
  refresh(): Promise<void>;
  clearSearch(): void;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  featured: [],
  services: [],
  searchResults: [],

  searchQuery: '',
  selectedCategory: null,
  sortBy: 'relevance',

  page: 1,
  totalCount: 0,
  hasMore: false,

  isFeaturedLoading: false,
  isServicesLoading: false,
  isSearching: false,

  featuredError: null,
  servicesError: null,

  async loadFeatured() {
    set({ isFeaturedLoading: true, featuredError: null });
    try {
      const featured = await serviceDiscoveryFacade.getFeatured();
      set({ featured, isFeaturedLoading: false });
    } catch (err) {
      set({
        isFeaturedLoading: false,
        featuredError: err instanceof Error ? err.message : 'Failed to load featured services',
      });
    }
  },

  async loadServices(reset = false) {
    const { selectedCategory, sortBy, page, services } = get();
    const targetPage = reset ? 1 : page;

    set({ isServicesLoading: true, servicesError: null });
    try {
      const { data, count } = await serviceDiscoveryFacade.getAll({
        category: selectedCategory,
        sortBy,
        page: targetPage,
        limit: PAGE_SIZE,
      });

      const merged = reset ? data : [...services, ...data];
      set({
        services: merged,
        page: targetPage,
        totalCount: count,
        hasMore: merged.length < count,
        isServicesLoading: false,
      });
    } catch (err) {
      set({
        isServicesLoading: false,
        servicesError: err instanceof Error ? err.message : 'Failed to load services',
      });
    }
  },

  async loadMore() {
    const state = get();
    if (!state.hasMore || state.isServicesLoading) return;

    const nextPage = state.page + 1;
    set({ isServicesLoading: true, servicesError: null, page: nextPage });

    try {
      const { data, count } = await serviceDiscoveryFacade.getAll({
        category: state.selectedCategory,
        sortBy: state.sortBy,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      set((s) => {
        const merged = [...s.services, ...data];
        return {
          services: merged,
          totalCount: count,
          hasMore: merged.length < count,
          isServicesLoading: false,
        };
      });
    } catch (err) {
      set({
        isServicesLoading: false,
        page: state.page,
        servicesError: err instanceof Error ? err.message : 'Failed to load more services',
      });
    }
  },

  async search(query: string) {
    set({ searchQuery: query, isSearching: true });
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    try {
      const results = await serviceDiscoveryFacade.search(query, get().selectedCategory);
      set({ searchResults: results, isSearching: false });
    } catch {
      set({ isSearching: false, searchResults: [] });
    }
  },

  setCategory(category: string | null) {
    set({ selectedCategory: category, page: 1, services: [] });
    get().loadServices(true);
  },

  setSortBy(sort: SortOption) {
    set({ sortBy: sort, page: 1, services: [] });
    get().loadServices(true);
  },

  async refresh() {
    await Promise.all([get().loadFeatured(), get().loadServices(true)]);
  },

  clearSearch() {
    set({ searchQuery: '', searchResults: [] });
  },
}));

// Selectors
export const selectFeatured = (s: ServiceState) => s.featured;
export const selectServices = (s: ServiceState) => s.services;
export const selectSearchResults = (s: ServiceState) => s.searchResults;
export const selectSearchQuery = (s: ServiceState) => s.searchQuery;
export const selectSelectedCategory = (s: ServiceState) => s.selectedCategory;
export const selectSortBy = (s: ServiceState) => s.sortBy;
export const selectHasMore = (s: ServiceState) => s.hasMore;
export const selectIsFeaturedLoading = (s: ServiceState) => s.isFeaturedLoading;
export const selectIsServicesLoading = (s: ServiceState) => s.isServicesLoading;
export const selectIsSearching = (s: ServiceState) => s.isSearching;
export const selectFeaturedError = (s: ServiceState) => s.featuredError;
export const selectServicesError = (s: ServiceState) => s.servicesError;
