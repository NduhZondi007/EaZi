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
  CheckCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  MapPin,
  PlayCircle,
  User,
  Wrench,
  XCircle,
} from 'lucide-react-native';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { BookingTimeline } from '@/components/bookings/BookingTimeline';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Colors } from '@/constants/colors';
import { realtimeManager } from '@/services/realtime.manager';
import {
  useProviderStore,
  selectProviderActiveBooking,
  selectIsBookingsLoading,
  selectIsActionLoading,
  selectProviderError,
} from '@/stores/provider.store';
import type { ProviderBookingsStackScreenProps } from '@/types/navigation.types';
import type { BookingStatus } from '@/types/database.types';

type Props = ProviderBookingsStackScreenProps<'ProviderBookingDetail'>;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Credit/Debit Card',
  wallet: 'EaZi Wallet',
  eazi_cash: 'EaZi Cash',
};

type StatusAction = {
  label: string;
  nextStatus: BookingStatus;
  variant: 'primary' | 'secondary';
  icon: React.ReactNode;
  destructive?: boolean;
};

function getProviderActions(status: BookingStatus): StatusAction[] {
  switch (status) {
    case 'confirmed':
      return [
        {
          label: 'Accept Booking',
          nextStatus: 'accepted',
          variant: 'primary',
          icon: <CheckCircle size={16} color="#FFFFFF" />,
        },
        {
          label: 'Decline Booking',
          nextStatus: 'declined',
          variant: 'secondary',
          icon: <XCircle size={16} color={Colors.error} />,
          destructive: true,
        },
      ];
    case 'accepted':
      return [
        {
          label: 'Mark as Arrived',
          nextStatus: 'arrived',
          variant: 'primary',
          icon: <MapPin size={16} color="#FFFFFF" />,
        },
      ];
    case 'arrived':
      return [
        {
          label: 'Start Service',
          nextStatus: 'in_progress',
          variant: 'primary',
          icon: <PlayCircle size={16} color="#FFFFFF" />,
        },
      ];
    case 'in_progress':
      return [
        {
          label: 'Complete Service',
          nextStatus: 'completed',
          variant: 'primary',
          icon: <CheckCircle size={16} color="#FFFFFF" />,
        },
      ];
    default:
      return [];
  }
}

export function ProviderBookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;

  const booking = useProviderStore(selectProviderActiveBooking);
  const isLoading = useProviderStore(selectIsBookingsLoading);
  const isActionLoading = useProviderStore(selectIsActionLoading);
  const error = useProviderStore(selectProviderError);
  const {
    loadBooking,
    acceptBooking,
    declineBooking,
    advanceBookingStatus,
    updateBookingRealtime,
    clearActiveBooking,
  } = useProviderStore();

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
      clearActiveBooking();
    };
  }, [bookingId, load, updateBookingRealtime, clearActiveBooking]);

  const handleAction = useCallback(
    (action: StatusAction) => {
      if (!booking) return;
      const confirmLabel = action.destructive ? 'Decline' : action.label;
      Alert.alert(
        action.label,
        `${action.label} for ${booking.client.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: confirmLabel,
            style: action.destructive ? 'destructive' : 'default',
            onPress: () => {
              if (action.nextStatus === 'accepted') {
                acceptBooking(booking.id, booking.status);
              } else if (action.nextStatus === 'declined') {
                declineBooking(booking.id, booking.status);
              } else {
                advanceBookingStatus(booking.id, booking.status, action.nextStatus);
              }
            },
          },
        ],
      );
    },
    [booking, acceptBooking, declineBooking, advanceBookingStatus],
  );

  const openInMaps = useCallback((address: string) => {
    const encoded = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encoded}`).catch(() => null);
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
  const actions = getProviderActions(booking.status);

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

          {/* Client */}
          <DetailRow icon={<User size={16} color={Colors.gray500} />} label="Client">
            <View className="flex-row items-center gap-2">
              {booking.client.profile_image_url ? (
                <Image
                  source={{ uri: booking.client.profile_image_url }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center">
                  <Text className="text-xs font-bold text-gray-500">
                    {booking.client.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text className="text-sm font-medium text-gray-900">
                {booking.client.name}
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
                Service for Someone Else
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

          {/* Provider Actions */}
          {actions.length > 0 && (
            <View className="gap-3 pt-2">
              {actions.map((action) => (
                <Pressable
                  key={action.nextStatus}
                  onPress={() => handleAction(action)}
                  disabled={isActionLoading}
                  className={`h-12 rounded-xl items-center justify-center flex-row gap-2 ${
                    action.variant === 'primary'
                      ? 'bg-[#111111]'
                      : 'bg-transparent border-2 border-gray-200'
                  } ${isActionLoading ? 'opacity-50' : ''}`}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  {isActionLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={action.variant === 'primary' ? '#FFFFFF' : Colors.primary}
                    />
                  ) : (
                    <>
                      {action.icon}
                      <Text
                        className={`text-sm font-semibold ${
                          action.variant === 'primary' ? 'text-white' : 'text-red-600'
                        }`}
                      >
                        {action.label}
                      </Text>
                    </>
                  )}
                </Pressable>
              ))}
            </View>
          )}
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
