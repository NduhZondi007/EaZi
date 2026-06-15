import { useCallback } from 'react';
import {
  useServiceStore,
  selectServices,
  selectFeatured,
  selectSearchResults,
  selectSelectedCategory,
  selectSortBy,
  selectIsServicesLoading,
  selectIsFeaturedLoading,
  selectIsSearching,
  selectServicesError,
} from '@/stores/service.store';
import type { SortOption } from '@/types/service.types';

export function useServices() {
  const services = useServiceStore(selectServices);
  const featured = useServiceStore(selectFeatured);
  const searchResults = useServiceStore(selectSearchResults);
  const selectedCategory = useServiceStore(selectSelectedCategory);
  const sortBy = useServiceStore(selectSortBy);
  const isServicesLoading = useServiceStore(selectIsServicesLoading);
  const isFeaturedLoading = useServiceStore(selectIsFeaturedLoading);
  const isSearching = useServiceStore(selectIsSearching);
  const error = useServiceStore(selectServicesError);
  const {
    loadFeatured,
    loadServices,
    search,
    setCategory,
    setSortBy,
    loadMore,
    clearSearch,
    refresh,
  } = useServiceStore();

  const handleSearch = useCallback(
    (query: string) => {
      search(query);
    },
    [search],
  );

  const handleCategoryFilter = useCallback(
    (category: string | null) => {
      setCategory(category);
    },
    [setCategory],
  );

  const handleSortChange = useCallback(
    (sort: SortOption) => {
      setSortBy(sort);
    },
    [setSortBy],
  );

  return {
    services,
    featured,
    searchResults,
    selectedCategory,
    sortBy,
    isServicesLoading,
    isFeaturedLoading,
    isSearching,
    error,
    loadFeatured,
    loadServices,
    loadMore,
    refresh,
    search: handleSearch,
    setCategory: handleCategoryFilter,
    setSortBy: handleSortChange,
    clearSearch,
  };
}
