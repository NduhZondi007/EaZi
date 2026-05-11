import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart2,
  Banknote,
  Calendar,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { AdminTabParamList, AdminTabScreenProps } from '@/types/navigation.types';
import type { AdminDashboardStats } from '@/repositories/admin.repository';

type Props = AdminTabScreenProps<'Dashboard'>;
type AdminNav = BottomTabNavigationProp<AdminTabParamList>;

export function AdminDashboardScreen(_: Props) {
  const profile = useAuthStore(selectProfile);
  const navigation = useNavigation<AdminNav>();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getDashboardStats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = profile?.name?.split(' ')[0] ?? 'Admin';

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
            <LayoutDashboard size={20} color={Colors.primary} />
            <Text className="text-lg font-bold text-gray-900">EaZi Admin</Text>
          </View>
          <Text className="text-sm text-gray-500 mt-0.5">Welcome back, {firstName}</Text>
        </View>

        {error ? (
          <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        {isLoading && !stats ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View className="px-4 pt-4 gap-3">
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform Overview
              </Text>
              <View className="flex-row gap-3">
                <StatCard
                  icon={<Users size={20} color={Colors.info} />}
                  label="Total Users"
                  value={String(stats?.total_users ?? 0)}
                  bg="bg-blue-50"
                />
                <StatCard
                  icon={<ShieldCheck size={20} color={Colors.success} />}
                  label="Providers"
                  value={String(stats?.total_providers ?? 0)}
                  bg="bg-green-50"
                />
              </View>
              <View className="flex-row gap-3">
                <StatCard
                  icon={<Calendar size={20} color={Colors.warning} />}
                  label="Bookings (Month)"
                  value={String(stats?.bookings_this_month ?? 0)}
                  bg="bg-amber-50"
                />
                <StatCard
                  icon={<Banknote size={20} color="#8B5CF6" />}
                  label="Revenue (Month)"
                  value={`R${((stats?.revenue_this_month ?? 0) / 100).toFixed(0)}`}
                  bg="bg-purple-50"
                />
              </View>
            </View>

            {/* Quick Nav */}
            <View className="px-4 mt-5 mb-8">
              <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </Text>
              <View className="gap-2">
                <QuickNavCard
                  icon={<Users size={18} color={Colors.info} />}
                  title="Manage Users"
                  subtitle="View and manage all platform users"
                  onPress={() => navigation.navigate('Users')}
                />
                <QuickNavCard
                  icon={<ShieldCheck size={18} color={Colors.success} />}
                  title="Verification Queue"
                  subtitle="Review pending provider applications"
                  onPress={() => navigation.navigate('Verification')}
                />
                <QuickNavCard
                  icon={<HelpCircle size={18} color={Colors.warning} />}
                  title="Support Queries"
                  subtitle="Resolve user support tickets"
                  onPress={() => navigation.navigate('Queries')}
                />
                <QuickNavCard
                  icon={<BarChart2 size={18} color="#8B5CF6" />}
                  title="Analytics"
                  subtitle="Revenue and platform performance"
                  onPress={() => navigation.navigate('Analytics')}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <View className={`flex-1 ${bg} rounded-2xl p-4`}>
      <View className="mb-2">{icon}</View>
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500 mt-0.5">{label}</Text>
    </View>
  );
}

function QuickNavCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white rounded-xl border border-gray-100 px-4 py-3 gap-3 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View className="w-9 h-9 rounded-xl bg-gray-50 items-center justify-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900">{title}</Text>
        <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
      </View>
      <TrendingUp size={14} color={Colors.gray400} />
    </Pressable>
  );
}
