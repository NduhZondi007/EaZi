import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Calendar } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookingCard } from '@/components/bookings/BookingCard';
import { Colors } from '@/constants/colors';
import {
  useProviderStore,
  selectAllProviderBookings,
  selectIsBookingsLoading,
} from '@/stores/provider.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { BookingWithDetails } from '@/types/booking.types';
import type { BookingStatus } from '@/types/database.types';
import type { ProviderBookingsStackScreenProps } from '@/types/navigation.types';

type Props = ProviderBookingsStackScreenProps<'ProviderBookingsList'>;

type FilterTab = 'all' | 'pending' | 'active' | 'completed';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

const ACTIVE_STATUSES: BookingStatus[] = ['accepted', 'arrived', 'in_progress'];
const COMPLETED_STATUSES: BookingStatus[] = ['completed', 'reviewed'];
const PENDING_STATUSES: BookingStatus[] = ['confirmed'];

function filterBookings(bookings: BookingWithDetails[], tab: FilterTab): BookingWithDetails[] {
  switch (tab) {
    case 'pending':
      return bookings.filter((b) => PENDING_STATUSES.includes(b.status));
    case 'active':
      return bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
    case 'completed':
      return bookings.filter((b) => COMPLETED_STATUSES.includes(b.status));
    default:
      return bookings;
  }
}

export function ProviderBookingsScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const allBookings = useProviderStore(selectAllProviderBookings);
  const isLoading = useProviderStore(selectIsBookingsLoading);
  const { loadAllBookings } = useProviderStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const load = useCallback(() => {
    if (profile?.id) loadAllBookings(profile.id);
  }, [profile?.id, loadAllBookings]);

  useEffect(() => {
    load();
  }, [load]);

  const displayed = filterBookings(allBookings, activeTab);

  const handlePress = useCallback(
    (booking: BookingWithDetails) => {
      navigation.navigate('ProviderBookingDetail', { bookingId: booking.id });
    },
    [navigation],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-base font-semibold text-gray-900">Bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row bg-white border-b border-gray-100 px-2">
        {FILTER_TABS.map(({ key, label }) => {
          const count =
            key === 'all'
              ? allBookings.length
              : filterBookings(allBookings, key).length;
          const isActive = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              className="flex-1 py-3 items-center"
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {label}
                </Text>
                {count > 0 && (
                  <View
                    className={`rounded-full px-1.5 py-0.5 ${
                      isActive ? 'bg-[#111111]' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-semibold ${
                        isActive ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </View>
              {isActive && (
                <View className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#111111] rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>

      {isLoading && allBookings.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlashList
          data={displayed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard booking={item} onPress={handlePress} />
          )}
          estimatedItemSize={110}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <EmptyState
                icon={<Calendar size={40} color={Colors.gray400} />}
                title="No bookings"
                subtitle={
                  activeTab === 'all'
                    ? 'Bookings from clients will appear here'
                    : `No ${activeTab} bookings`
                }
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
