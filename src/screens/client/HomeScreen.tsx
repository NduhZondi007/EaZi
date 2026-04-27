import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ServiceCard } from '@/components/services/ServiceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  selectFeatured,
  selectFeaturedError,
  selectHasMore,
  selectIsFeaturedLoading,
  selectIsSearching,
  selectIsServicesLoading,
  selectSearchResults,
  selectSelectedCategory,
  selectServices,
  selectServicesError,
  selectSortBy,
  useServiceStore,
} from '@/stores/service.store';
import type { SortOption } from '@/types/service.types';
import type { HomeStackScreenProps } from '@/types/navigation.types';
import type { ServiceWithProvider } from '@/types/service.types';

const SERVICE_CATEGORIES = [
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Beauty',
  'Transport',
  'Tutoring',
  'Photography',
  'Personal Training',
  'Gardening',
  'Handyman',
  'Moving',
  'Catering',
  'Other',
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price Low–High', value: 'price_asc' },
  { label: 'Price High–Low', value: 'price_desc' },
  { label: 'Rating High–Low', value: 'rating_desc' },
  { label: 'Distance Near–Far', value: 'distance_asc' },
];

type Props = HomeStackScreenProps<'HomeMain'>;

export function HomeScreen({ navigation }: Props) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const searchRef = useRef<TextInput>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const featured = useServiceStore(selectFeatured);
  const services = useServiceStore(selectServices);
  const searchResults = useServiceStore(selectSearchResults);
  const selectedCategory = useServiceStore(selectSelectedCategory);
  const sortBy = useServiceStore(selectSortBy);
  const hasMore = useServiceStore(selectHasMore);
  const isFeaturedLoading = useServiceStore(selectIsFeaturedLoading);
  const isServicesLoading = useServiceStore(selectIsServicesLoading);
  const isSearching = useServiceStore(selectIsSearching);
  const featuredError = useServiceStore(selectFeaturedError);
  const servicesError = useServiceStore(selectServicesError);

  const {
    loadFeatured,
    loadServices,
    loadMore,
    search,
    setCategory,
    setSortBy,
    refresh,
    clearSearch,
  } = useServiceStore();

  useEffect(() => {
    loadFeatured();
    loadServices(true);
  }, []);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      search(searchInput);
    }, 300);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchInput]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchInput('');
    clearSearch();
  }, [clearSearch]);

  const navigateToDetail = useCallback(
    (serviceId: string) => {
      navigation.navigate('ServiceDetail', { serviceId });
    },
    [navigation],
  );

  const navigateToProvider = useCallback(
    (providerId: string) => {
      navigation.navigate('ProviderProfile', { providerId });
    },
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !isServicesLoading) loadMore();
  }, [hasMore, isServicesLoading, loadMore]);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const renderServiceItem = useCallback(
    ({ item }: { item: ServiceWithProvider }) => (
      <ServiceCard
        service={item}
        onPress={() => navigateToDetail(item.id)}
        variant="grid"
      />
    ),
    [navigateToDetail],
  );

  const ListHeader = (
    <View>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <Text className="text-2xl font-bold text-gray-900">EaZi</Text>
        <View className="flex-row items-center gap-1">
          <MapPin size={14} color={Colors.gray500} />
          <Text className="text-sm text-gray-500">South Africa</Text>
        </View>
      </View>

      {/* Search bar */}
      <Pressable
        onPress={openSearch}
        className="mx-4 mb-3 flex-row items-center bg-gray-100 rounded-xl px-4 h-11"
        accessibilityRole="search"
        accessibilityLabel="Search services"
      >
        <Search size={16} color={Colors.gray400} />
        <Text className="ml-2 text-sm text-gray-400 flex-1">
          What service do you need?
        </Text>
      </Pressable>

      {/* Category chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[null, ...SERVICE_CATEGORIES]}
        keyExtractor={(item) => item ?? '__all__'}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        renderItem={({ item: cat }) => {
          const isActive = selectedCategory === cat;
          return (
            <Pressable
              onPress={() => setCategory(cat)}
              className={[
                'mr-2 px-4 py-2 rounded-full border',
                isActive
                  ? 'bg-[#111111] border-[#111111]'
                  : 'bg-white border-gray-200',
              ].join(' ')}
            >
              <Text
                className={[
                  'text-xs font-medium',
                  isActive ? 'text-white' : 'text-gray-700',
                ].join(' ')}
              >
                {cat ?? 'All'}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Featured services */}
      {(isFeaturedLoading || featured.length > 0) && (
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 px-4 mb-3">
            Featured Services
          </Text>
          {isFeaturedLoading ? (
            <View className="h-[220px] items-center justify-center">
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : featuredError ? null : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featured}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingLeft: 16 }}
              renderItem={({ item }) => (
                <ServiceCard
                  service={item}
                  onPress={() => navigateToDetail(item.id)}
                  variant="horizontal"
                />
              )}
            />
          )}
        </View>
      )}

      {/* All Services heading + sort */}
      <View className="flex-row items-center justify-between px-4 mb-2">
        <Text className="text-base font-semibold text-gray-900">All Services</Text>
        <Pressable
          onPress={() => setIsSortOpen(true)}
          className="flex-row items-center gap-1"
          accessibilityRole="button"
          accessibilityLabel="Sort services"
        >
          <SlidersHorizontal size={14} color={Colors.gray500} />
          <Text className="text-sm text-gray-500 capitalize">
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort'}
          </Text>
          <ChevronDown size={14} color={Colors.gray500} />
        </Pressable>
      </View>
    </View>
  );

  const ListFooter =
    isServicesLoading && services.length > 0 ? (
      <View className="py-6 items-center">
        <ActivityIndicator color={Colors.primary} />
      </View>
    ) : !hasMore && services.length > 0 ? (
      <View className="py-4 items-center">
        <Text className="text-xs text-gray-400">All services loaded</Text>
      </View>
    ) : null;

  const ListEmpty =
    isServicesLoading && services.length === 0 ? (
      <View className="h-48 items-center justify-center">
        <ActivityIndicator color={Colors.primary} />
      </View>
    ) : servicesError ? (
      <ErrorState
        title="Failed to load services"
        message={servicesError}
        onRetry={() => loadServices(true)}
      />
    ) : (
      <EmptyState
        icon={<Search size={40} color={Colors.gray400} />}
        title="No services found"
        subtitle={
          selectedCategory
            ? `No ${selectedCategory} services available`
            : 'Check back soon for new listings'
        }
      />
    );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Main list */}
      <FlashList
        data={services}
        numColumns={2}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isFeaturedLoading && services.length === 0}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

      {/* Search overlay */}
      {isSearchOpen && (
        <View className="absolute inset-0 bg-white" style={{ zIndex: 50 }}>
          <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
            {/* Search input row */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
              <TextInput
                ref={searchRef}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="What service do you need?"
                placeholderTextColor={Colors.gray400}
                className="flex-1 text-sm text-gray-900 h-11"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Pressable onPress={closeSearch} className="ml-3 p-1">
                <X size={20} color={Colors.gray500} />
              </Pressable>
            </View>

            {/* Search results */}
            {isSearching ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : searchResults.length === 0 && searchInput.trim() ? (
              <EmptyState
                icon={<Search size={40} color={Colors.gray400} />}
                title="No results"
                subtitle={`No services found for "${searchInput}"`}
              />
            ) : searchResults.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="text-sm text-gray-400 text-center">
                  Start typing to search for services
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ padding: 8 }}
                renderItem={({ item }) => (
                  <ServiceCard
                    service={item}
                    onPress={() => {
                      closeSearch();
                      navigateToDetail(item.id);
                    }}
                    variant="grid"
                  />
                )}
              />
            )}
          </SafeAreaView>
        </View>
      )}

      {/* Sort modal */}
      <Modal
        visible={isSortOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSortOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setIsSortOpen(false)}
        >
          <Pressable className="bg-white rounded-t-2xl p-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setSortBy(opt.value);
                  setIsSortOpen(false);
                }}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
              >
                <Text
                  className={[
                    'text-sm',
                    sortBy === opt.value ? 'font-semibold text-gray-900' : 'text-gray-600',
                  ].join(' ')}
                >
                  {opt.label}
                </Text>
                {sortBy === opt.value && (
                  <View className="w-2 h-2 rounded-full bg-[#111111]" />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
