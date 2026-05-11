import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart2,
  Banknote,
  Briefcase,
  TrendingUp,
  UserPlus,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import type { AdminAnalytics } from '@/repositories/admin.repository';
import type { AdminTabScreenProps } from '@/types/navigation.types';

type Props = AdminTabScreenProps<'Analytics'>;

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.gray400,
  confirmed: Colors.info,
  accepted: Colors.success,
  arrived: Colors.warning,
  in_progress: Colors.warning,
  completed: Colors.success,
  declined: Colors.error,
  cancelled: Colors.error,
  reviewed: '#8B5CF6',
};

export function AnalyticsScreen(_: Props) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getAnalytics();
      setAnalytics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const maxRevenue = Math.max(
    ...(analytics?.monthlyRevenue.map((m) => m.revenue) ?? [1]),
    1,
  );
  const maxGrowth = Math.max(
    ...(analytics?.userGrowth.map((m) => m.count) ?? [1]),
    1,
  );
  const totalBookings =
    analytics?.bookingsByStatus.reduce((sum, s) => sum + s.count, 0) ?? 0;

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
          <View className="flex-row items-center gap-2">
            <BarChart2 size={18} color={Colors.primary} />
            <Text className="text-lg font-bold text-gray-900">Analytics</Text>
          </View>
          <Text className="text-xs text-gray-500 mt-0.5">Last 6 months</Text>
        </View>

        {error ? (
          <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {isLoading && !analytics ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : analytics ? (
          <>
            {/* Monthly Revenue Chart */}
            <View className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <Banknote size={16} color="#8B5CF6" />
                <Text className="text-sm font-semibold text-gray-900">Monthly Revenue</Text>
              </View>
              {analytics.monthlyRevenue.length === 0 ? (
                <Text className="text-sm text-gray-400 text-center py-4">No data yet</Text>
              ) : (
                <BarChart
                  data={analytics.monthlyRevenue.map((m) => ({
                    label: m.month,
                    value: m.revenue,
                    displayValue: `R${(m.revenue / 100).toFixed(0)}`,
                  }))}
                  maxValue={maxRevenue}
                  barColor="#8B5CF6"
                />
              )}
            </View>

            {/* User Growth Chart */}
            <View className="bg-white mx-4 mt-3 rounded-2xl border border-gray-100 p-4">
              <View className="flex-row items-center gap-2 mb-4">
                <UserPlus size={16} color={Colors.info} />
                <Text className="text-sm font-semibold text-gray-900">New Users</Text>
              </View>
              {analytics.userGrowth.length === 0 ? (
                <Text className="text-sm text-gray-400 text-center py-4">No data yet</Text>
              ) : (
                <BarChart
                  data={analytics.userGrowth.map((m) => ({
                    label: m.month,
                    value: m.count,
                    displayValue: String(m.count),
                  }))}
                  maxValue={maxGrowth}
                  barColor={Colors.info}
                />
              )}
            </View>

            {/* Booking Status Breakdown */}
            <View className="bg-white mx-4 mt-3 rounded-2xl border border-gray-100 p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <TrendingUp size={16} color={Colors.success} />
                <Text className="text-sm font-semibold text-gray-900">
                  Bookings by Status
                </Text>
                <View className="ml-auto bg-gray-100 rounded-full px-2 py-0.5">
                  <Text className="text-xs font-medium text-gray-600">{totalBookings} total</Text>
                </View>
              </View>
              {analytics.bookingsByStatus.length === 0 ? (
                <Text className="text-sm text-gray-400 text-center py-4">No data yet</Text>
              ) : (
                <View className="gap-2">
                  {analytics.bookingsByStatus
                    .sort((a, b) => b.count - a.count)
                    .map((s) => {
                      const color = STATUS_COLORS[s.status] ?? Colors.gray500;
                      const pct = totalBookings > 0 ? (s.count / totalBookings) * 100 : 0;
                      const label =
                        s.status.charAt(0).toUpperCase() +
                        s.status.slice(1).replace('_', ' ');
                      return (
                        <View key={s.status}>
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs text-gray-600">{label}</Text>
                            <Text className="text-xs font-medium text-gray-900">
                              {s.count} ({pct.toFixed(0)}%)
                            </Text>
                          </View>
                          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <View
                              className="h-2 rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </View>
                        </View>
                      );
                    })}
                </View>
              )}
            </View>

            {/* Top Services */}
            {analytics.topServices.length > 0 ? (
              <View className="bg-white mx-4 mt-3 mb-8 rounded-2xl border border-gray-100 p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Briefcase size={16} color={Colors.warning} />
                  <Text className="text-sm font-semibold text-gray-900">Top Services</Text>
                </View>
                <View className="gap-2">
                  {analytics.topServices.map((svc, idx) => (
                    <View
                      key={`${svc.title}-${idx}`}
                      className="flex-row items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center">
                        <Text className="text-xs font-bold text-gray-600">{idx + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-gray-900" numberOfLines={1}>
                          {svc.business_name}
                        </Text>
                        <Text className="text-xs text-gray-400" numberOfLines={1}>
                          {svc.title}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs font-semibold text-gray-900">
                          {svc.bookingCount} bookings
                        </Text>
                        <Text className="text-xs text-green-600">
                          R{(svc.revenue / 100).toFixed(0)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View className="h-8" />
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function BarChart({
  data,
  maxValue,
  barColor,
}: {
  data: { label: string; value: number; displayValue: string }[];
  maxValue: number;
  barColor: string;
}) {
  const BAR_MAX_HEIGHT = 80;

  return (
    <View>
      <View className="flex-row items-end justify-between" style={{ height: BAR_MAX_HEIGHT + 24 }}>
        {data.map((item) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * BAR_MAX_HEIGHT : 4;
          return (
            <View key={item.label} className="flex-1 items-center justify-end gap-1">
              {item.value > 0 ? (
                <Text className="text-xs text-gray-500">{item.displayValue}</Text>
              ) : null}
              <View
                className="w-full max-w-[32px] rounded-t-md"
                style={{
                  height: Math.max(barHeight, 4),
                  backgroundColor: item.value > 0 ? barColor : Colors.gray200,
                }}
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between mt-2">
        {data.map((item) => (
          <View key={item.label} className="flex-1 items-center">
            <Text className="text-xs text-gray-400">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
