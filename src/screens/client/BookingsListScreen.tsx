import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import { BookingCard } from '@/components/bookings/BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Colors } from '@/constants/colors';
import {
  useBookingStore,
  selectBookings,
  selectIsBookingLoading,
  selectBookingError,
} from '@/stores/booking.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { BookingsStackScreenProps } from '@/types/navigation.types';
import type { BookingWithDetails } from '@/types/booking.types';

type Props = BookingsStackScreenProps<'BookingsList'>;

const STATUS_GROUPS = ['active', 'completed', 'cancelled'] as const;
type StatusGroup = (typeof STATUS_GROUPS)[number];

const GROUP_LABELS: Record<StatusGroup, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled / Declined',
};

const ACTIVE_STATUSES = new Set([
  'pending',
  'confirmed',
  'accepted',
  'arrived',
  'in_progress',
]);
const DONE_STATUSES = new Set(['completed', 'reviewed']);
const CANCELLED_STATUSES = new Set(['cancelled', 'declined']);

function groupBooking(booking: BookingWithDetails): StatusGroup {
  if (ACTIVE_STATUSES.has(booking.status)) return 'active';
  if (DONE_STATUSES.has(booking.status)) return 'completed';
  return 'cancelled';
}

export function BookingsListScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const bookings = useBookingStore(selectBookings);
  const isLoading = useBookingStore(selectIsBookingLoading);
  const error = useBookingStore(selectBookingError);
  const { loadClientBookings } = useBookingStore();

  const load = useCallback(() => {
    if (profile?.id) {
      loadClientBookings(profile.id);
    }
  }, [profile?.id, loadClientBookings]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = useCallback(
    (booking: BookingWithDetails) => {
      navigation.navigate('BookingDetail', { bookingId: booking.id });
    },
    [navigation],
  );

  if (isLoading && bookings.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900">My Bookings</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900">My Bookings</Text>
        </View>
        <ErrorState
          title="Could not load bookings"
          message={error}
          onRetry={load}
        />
      </SafeAreaView>
    );
  }

  const grouped: Record<StatusGroup, BookingWithDetails[]> = {
    active: [],
    completed: [],
    cancelled: [],
  };

  bookings.forEach((b) => {
    grouped[groupBooking(b)].push(b);
  });

  const hasAny = bookings.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">My Bookings</Text>
      </View>

      {!hasAny ? (
        <EmptyState
          icon={<Calendar size={40} color={Colors.gray400} />}
          title="No bookings yet"
          subtitle="Book a service to get started. Your bookings will appear here."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={load}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        >
          {STATUS_GROUPS.map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;

            return (
              <View key={group} className="mb-2">
                <View className="px-4 py-2">
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {GROUP_LABELS[group]} ({items.length})
                  </Text>
                </View>
                {items.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onPress={handlePress}
                  />
                ))}
              </View>
            );
          })}

          {error ? (
            <View className="mx-4 mt-2">
              <Pressable onPress={load}>
                <Text className="text-sm text-blue-600 text-center">Retry</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
