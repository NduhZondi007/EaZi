import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Star,
  TrendingUp,
  User,
  Wallet,
  XCircle,
} from 'lucide-react-native';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { Colors } from '@/constants/colors';
import { realtimeManager } from '@/services/realtime.manager';
import {
  useProviderStore,
  selectProviderStats,
  selectTodaysBookings,
  selectPendingBookings,
  selectIsStatsLoading,
  selectProviderError,
} from '@/stores/provider.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { ProviderTabScreenProps } from '@/types/navigation.types';
import type { BookingWithDetails } from '@/types/booking.types';

type Props = ProviderTabScreenProps<'Dashboard'>;

export function ProviderDashboardScreen(_: Props) {
  const profile = useAuthStore(selectProfile);
  const stats = useProviderStore(selectProviderStats);
  const todaysBookings = useProviderStore(selectTodaysBookings);
  const pendingBookings = useProviderStore(selectPendingBookings);
  const isLoading = useProviderStore(selectIsStatsLoading);
  const error = useProviderStore(selectProviderError);
  const { loadDashboard, acceptBooking, declineBooking, updateBookingRealtime } =
    useProviderStore();

  const load = useCallback(() => {
    if (profile?.id) loadDashboard(profile.id);
  }, [profile?.id, loadDashboard]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!profile?.id) return;
    const channels: (() => void)[] = pendingBookings.map((b) =>
      realtimeManager.subscribeToBooking(b.id, (payload) => {
        updateBookingRealtime(payload.new);
      }),
    );
    return () => channels.forEach((unsub) => unsub());
  }, [pendingBookings, profile?.id, updateBookingRealtime]);

  const handleAccept = useCallback(
    (booking: BookingWithDetails) => {
      Alert.alert('Accept Booking', `Accept booking from ${booking.client.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => acceptBooking(booking.id, booking.status),
        },
      ]);
    },
    [acceptBooking],
  );

  const handleDecline = useCallback(
    (booking: BookingWithDetails) => {
      Alert.alert('Decline Booking', `Decline booking from ${booking.client.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => declineBooking(booking.id, booking.status),
        },
      ]);
    },
    [declineBooking],
  );

  const today = format(new Date(), 'EEEE, MMMM d');
  const greeting = profile?.name ? `Hello, ${profile.name.split(' ')[0]}` : 'Hello';

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              {profile?.profile_image_url ? (
                <Image
                  source={{ uri: profile.profile_image_url }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-11 h-11 rounded-full bg-gray-200 items-center justify-center">
                  <User size={22} color={Colors.gray500} />
                </View>
              )}
              <View>
                <Text className="text-lg font-bold text-gray-900">{greeting}</Text>
                <Text className="text-xs text-gray-400">{today}</Text>
              </View>
            </View>
          </View>
        </View>

        {error ? (
          <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* Earnings Card */}
        <View className="mx-4 mt-4 bg-[#111111] rounded-2xl p-5">
          <Text className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Earnings Overview
          </Text>
          <View className="flex-row gap-2">
            <EarningsBox
              label="This Month"
              value={`R${(stats?.monthlyEarnings ?? 0).toFixed(0)}`}
              icon={<TrendingUp size={14} color={Colors.accent} />}
            />
            <EarningsBox
              label="Pending"
              value={`R${(stats?.pendingEarnings ?? 0).toFixed(0)}`}
              icon={<Clock size={14} color={Colors.warning} />}
            />
            <EarningsBox
              label="Balance"
              value={`R${(stats?.availableBalance ?? 0).toFixed(0)}`}
              icon={<Wallet size={14} color={Colors.info} />}
            />
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row mx-4 mt-3 gap-3">
          <StatCard
            icon={<Calendar size={18} color={Colors.info} />}
            label="Today"
            value={String(stats?.bookingsToday ?? 0)}
            sub="bookings"
          />
          <StatCard
            icon={<CheckCircle size={18} color={Colors.success} />}
            label="Completion"
            value={`${stats?.completionRate ?? 0}%`}
            sub="rate"
          />
          <StatCard
            icon={<Star size={18} color={Colors.warning} />}
            label="Rating"
            value={(stats?.avgRating ?? 0).toFixed(1)}
            sub="avg"
          />
        </View>

        {/* Pending Bookings */}
        <SectionHeader title="Pending Approval" count={pendingBookings.length} />
        {isLoading && pendingBookings.length === 0 ? (
          <ActivityIndicator className="my-4" color={Colors.primary} />
        ) : pendingBookings.length === 0 ? (
          <EmptySection message="No pending bookings" icon={<Calendar size={20} color={Colors.gray400} />} />
        ) : (
          pendingBookings.map((booking) => (
            <PendingBookingCard
              key={booking.id}
              booking={booking}
              onAccept={() => handleAccept(booking)}
              onDecline={() => handleDecline(booking)}
            />
          ))
        )}

        {/* Today's Schedule */}
        <SectionHeader title="Today's Schedule" count={todaysBookings.length} />
        {todaysBookings.length === 0 ? (
          <EmptySection message="Nothing scheduled for today" icon={<Clock size={20} color={Colors.gray400} />} />
        ) : (
          todaysBookings.map((booking) => (
            <ScheduleItem key={booking.id} booking={booking} />
          ))
        )}

        {/* Quick Actions */}
        <View className="mx-4 mt-4 mb-8 gap-2">
          <Text className="text-sm font-semibold text-gray-900 mb-1">Quick Actions</Text>
          <QuickActionRow
            icon={<Briefcase size={18} color={Colors.primary} />}
            label="Manage Services"
          />
          <QuickActionRow
            icon={<Calendar size={18} color={Colors.primary} />}
            label="View All Bookings"
          />
          <QuickActionRow
            icon={<Banknote size={18} color={Colors.primary} />}
            label="Withdraw Earnings"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EarningsBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <View className="flex-1 bg-white/10 rounded-xl p-3">
      <View className="flex-row items-center gap-1 mb-1">{icon}</View>
      <Text className="text-base font-bold text-white">{value}</Text>
      <Text className="text-xs text-gray-400 mt-0.5">{label}</Text>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-xl p-3 border border-gray-100">
      <View className="mb-2">{icon}</View>
      <Text className="text-lg font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-400">{sub}</Text>
      <Text className="text-xs text-gray-500 mt-0.5">{label}</Text>
    </View>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View className="flex-row items-center justify-between px-4 mt-5 mb-2">
      <Text className="text-sm font-semibold text-gray-900">{title}</Text>
      {count > 0 && (
        <View className="bg-gray-100 rounded-full px-2 py-0.5">
          <Text className="text-xs font-medium text-gray-600">{count}</Text>
        </View>
      )}
    </View>
  );
}

function EmptySection({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <View className="mx-4 py-5 bg-white rounded-xl border border-gray-100 items-center gap-2">
      {icon}
      <Text className="text-sm text-gray-400">{message}</Text>
    </View>
  );
}

function PendingBookingCard({
  booking,
  onAccept,
  onDecline,
}: {
  booking: BookingWithDetails;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const dateLabel = booking.date;
  const timeLabel = booking.time.slice(0, 5);

  return (
    <View className="mx-4 mb-3 bg-white rounded-xl border border-gray-100 p-4">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {booking.service.business_name}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">{booking.service.title}</Text>
        </View>
        <Text className="text-sm font-bold text-gray-900">R{booking.amount.toFixed(0)}</Text>
      </View>

      <View className="flex-row items-center gap-3 mb-3">
        <View className="flex-row items-center gap-1">
          <User size={12} color={Colors.gray400} />
          <Text className="text-xs text-gray-500">{booking.client.name}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Calendar size={12} color={Colors.gray400} />
          <Text className="text-xs text-gray-500">{dateLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color={Colors.gray400} />
          <Text className="text-xs text-gray-500">{timeLabel}</Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={onDecline}
          className="flex-1 h-9 rounded-lg border border-gray-200 items-center justify-center flex-row gap-1"
          accessibilityRole="button"
          accessibilityLabel="Decline booking"
        >
          <XCircle size={14} color={Colors.error} />
          <Text className="text-xs font-semibold text-red-600">Decline</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          className="flex-1 h-9 rounded-lg bg-[#111111] items-center justify-center flex-row gap-1"
          accessibilityRole="button"
          accessibilityLabel="Accept booking"
        >
          <CheckCircle size={14} color="#FFFFFF" />
          <Text className="text-xs font-semibold text-white">Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScheduleItem({ booking }: { booking: BookingWithDetails }) {
  const timeLabel = booking.time.slice(0, 5);

  return (
    <View className="mx-4 mb-2 bg-white rounded-xl border border-gray-100 p-3 flex-row items-center gap-3">
      <View className="items-center w-12">
        <Text className="text-sm font-bold text-gray-900">{timeLabel}</Text>
      </View>
      <View className="w-px h-full bg-gray-100" />
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
          {booking.service.business_name}
        </Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <MapPin size={10} color={Colors.gray400} />
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {booking.service_address}
          </Text>
        </View>
      </View>
      <BookingStatusBadge status={booking.status} size="sm" />
    </View>
  );
}

function QuickActionRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Pressable
      className="flex-row items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-sm font-medium text-gray-900">{label}</Text>
      </View>
      <ArrowRight size={16} color={Colors.gray400} />
    </Pressable>
  );
}
