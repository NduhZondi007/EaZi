import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  Clock,
  CreditCard,
  MapPin,
  User,
  Wrench,
} from 'lucide-react-native';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingTimeline } from '@/components/bookings/BookingTimeline';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Colors } from '@/constants/colors';
import { realtimeManager } from '@/services/realtime.manager';
import {
  useBookingStore,
  selectActiveBooking,
  selectIsBookingLoading,
  selectBookingError,
} from '@/stores/booking.store';
import type { BookingsStackScreenProps } from '@/types/navigation.types';

type Props = BookingsStackScreenProps<'BookingDetail'>;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Credit/Debit Card',
  wallet: 'EaZi Wallet',
  eazi_cash: 'EaZi Cash',
};

export function BookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;

  const booking = useBookingStore(selectActiveBooking);
  const isLoading = useBookingStore(selectIsBookingLoading);
  const error = useBookingStore(selectBookingError);
  const { loadBooking, cancelBooking, updateBookingRealtime } = useBookingStore();

  const load = useCallback(() => {
    loadBooking(bookingId);
  }, [bookingId, loadBooking]);

  useEffect(() => {
    load();
    const unsubscribe = realtimeManager.subscribeToBooking(bookingId, (payload) => {
      updateBookingRealtime(payload.new);
    });
    return () => {
      unsubscribe();
    };
  }, [bookingId, load, updateBookingRealtime]);

  const handleCancel = useCallback(() => {
    if (!booking) return;
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => cancelBooking(booking.id, booking.status),
        },
      ],
    );
  }, [booking, cancelBooking]);

  const openInMaps = useCallback((address: string) => {
    const encoded = encodeURIComponent(address);
    const url = `https://maps.google.com/?q=${encoded}`;
    Linking.openURL(url).catch(() => null);
  }, []);

  if (isLoading && !booking) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <Pressable onPress={() => navigation.goBack()} className="absolute top-4 left-4">
          <ChevronLeft size={24} color={Colors.primary} />
        </Pressable>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <Pressable onPress={() => navigation.goBack()} className="p-4">
          <ChevronLeft size={24} color={Colors.primary} />
        </Pressable>
        <ErrorState
          title="Booking not found"
          message={error ?? 'This booking could not be loaded'}
          onRetry={load}
        />
      </SafeAreaView>
    );
  }

  const thumbnail = booking.service.gallery?.[0];
  const dateLabel = format(parseISO(booking.date), 'EEEE, MMMM d, yyyy');
  const timeLabel = booking.time.slice(0, 5);
  const canCancel = ['confirmed', 'pending'].includes(booking.status);
  const canReview = booking.status === 'completed' && !booking.is_reviewed;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900 text-center mr-6">
          Booking Details
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Service banner */}
        <View className="relative">
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: '100%', height: 180 }}
              contentFit="cover"
            />
          ) : (
            <View className="h-44 bg-gray-100 items-center justify-center">
              <Wrench size={40} color={Colors.gray400} />
            </View>
          )}
          <View className="absolute bottom-3 right-3">
            <BookingStatusBadge status={booking.status} size="md" />
          </View>
        </View>

        <View className="px-4 pt-4 pb-8 gap-5">
          {/* Service name */}
          <View>
            <Text className="text-xl font-bold text-gray-900">
              {booking.service.business_name}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">{booking.service.title}</Text>
          </View>

          {/* Provider */}
          <DetailRow icon={<User size={16} color={Colors.gray500} />} label="Provider">
            <View className="flex-row items-center gap-2">
              {booking.provider.profile_image_url ? (
                <Image
                  source={{ uri: booking.provider.profile_image_url }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center">
                  <Text className="text-xs font-bold text-gray-500">
                    {booking.provider.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text className="text-sm font-medium text-gray-900">
                {booking.provider.name}
              </Text>
            </View>
          </DetailRow>

          {/* Date & Time */}
          <DetailRow icon={<Calendar size={16} color={Colors.gray500} />} label="Date">
            <Text className="text-sm font-medium text-gray-900">{dateLabel}</Text>
          </DetailRow>

          <DetailRow icon={<Clock size={16} color={Colors.gray500} />} label="Time">
            <Text className="text-sm font-medium text-gray-900">{timeLabel}</Text>
          </DetailRow>

          {/* Address */}
          <DetailRow icon={<MapPin size={16} color={Colors.gray500} />} label="Location">
            <View className="gap-0.5">
              <Text className="text-sm font-medium text-gray-900">
                {booking.service_address}
              </Text>
              <Pressable onPress={() => openInMaps(booking.service_address)}>
                <Text className="text-xs text-blue-600 underline">Open in Maps</Text>
              </Pressable>
            </View>
          </DetailRow>

          {/* Recipient (if booking for other) */}
          {booking.booking_for === 'other' && booking.recipient_name && (
            <View className="bg-gray-50 rounded-xl p-3">
              <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Booking For Someone Else
              </Text>
              <Text className="text-sm font-medium text-gray-900">
                {booking.recipient_name}
              </Text>
              {booking.recipient_phone && (
                <Text className="text-sm text-gray-500">{booking.recipient_phone}</Text>
              )}
            </View>
          )}

          {/* Payment */}
          <DetailRow icon={<CreditCard size={16} color={Colors.gray500} />} label="Payment">
            <View>
              <Text className="text-base font-bold text-gray-900">
                R{booking.amount.toFixed(2)}
              </Text>
              {booking.payment_method && (
                <Text className="text-xs text-gray-400">
                  {PAYMENT_METHOD_LABELS[booking.payment_method] ?? booking.payment_method}
                </Text>
              )}
            </View>
          </DetailRow>

          {/* Status Timeline */}
          {booking.status_history.length > 0 && (
            <View>
              <Text className="text-sm font-semibold text-gray-900 mb-3">
                Status Timeline
              </Text>
              <BookingTimeline history={booking.status_history} />
            </View>
          )}

          {/* Actions */}
          <View className="gap-3 pt-2">
            {canCancel && (
              <Button
                label="Cancel Booking"
                variant="secondary"
                onPress={handleCancel}
                isLoading={isLoading}
              />
            )}
            {canReview && (
              <Button
                label="Leave a Review"
                variant="primary"
                onPress={() => {
                  /* Review flow in Phase 11 */
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row gap-3">
      <View className="w-8 h-8 bg-gray-50 rounded-lg items-center justify-center mt-0.5">
        {icon}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          {label}
        </Text>
        {children}
      </View>
    </View>
  );
}
