import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ServiceCard } from './ServiceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { ServiceWithProvider } from '@/types/service.types';
import { Search } from 'lucide-react-native';

interface ServiceListProps {
  services: ServiceWithProvider[];
  isLoading: boolean;
  onServicePress: (serviceId: string) => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  variant?: 'grid' | 'horizontal';
  emptyTitle?: string;
  emptyMessage?: string;
}

export const ServiceList = React.memo(function ServiceList({
  services,
  isLoading,
  onServicePress,
  onEndReached,
  hasMore = false,
  variant = 'grid',
  emptyTitle = 'No services found',
  emptyMessage = 'Try adjusting your search or filters.',
}: ServiceListProps) {
  if (isLoading && services.length === 0) {
    return <SkeletonList count={4} />;
  }

  if (!isLoading && services.length === 0) {
    return (
      <EmptyState
        icon={<Search size={40} color="#9CA3AF" />}
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return (
    <FlashList
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ServiceCard
          service={item}
          onPress={() => onServicePress(item.id)}
          variant={variant}
        />
      )}
      estimatedItemSize={220}
      numColumns={variant === 'grid' ? 2 : 1}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        hasMore ? (
          <View className="py-4 items-center">
            <ActivityIndicator color="#111111" />
          </View>
        ) : null
      }
      contentContainerStyle={{ padding: 16 }}
    />
  );
});
