import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronRight, Search, User, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import type { UserRow, UserRole } from '@/types/database.types';
import type { AdminUsersStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<AdminUsersStackParamList>;

type RoleFilter = 'all' | UserRole;
const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Clients', value: 'client' },
  { label: 'Providers', value: 'provider' },
  { label: 'Admins', value: 'admin' },
];

const ROLE_COLORS: Record<UserRole, string> = {
  client: '#2563EB',
  provider: '#16A34A',
  admin: '#8B5CF6',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#16A34A',
  suspended: '#DC2626',
  pending_verification: '#F59E0B',
};

export function UserListScreen() {
  const navigation = useNavigation<Nav>();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.listUsers();
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? '').toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [users, roleFilter, search]);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2 mb-3">
          <Users size={18} color={Colors.primary} />
          <Text className="text-lg font-bold text-gray-900">All Users</Text>
          <View className="ml-auto bg-gray-100 rounded-full px-2 py-0.5">
            <Text className="text-xs font-medium text-gray-600">{filtered.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
          <Search size={16} color={Colors.gray400} />
          <TextInput
            className="flex-1 text-sm text-gray-900"
            placeholder="Search by name, email or phone…"
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Role Filter Tabs */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        >
          {ROLE_TABS.map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setRoleFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full border ${
                roleFilter === tab.value
                  ? 'bg-[#111111] border-[#111111]'
                  : 'bg-white border-gray-200'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${tab.label}`}
            >
              <Text
                className={`text-xs font-medium ${
                  roleFilter === tab.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} />
        }
      >
        {isLoading && users.length === 0 ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View className="mt-12 items-center px-8">
            <Users size={40} color={Colors.gray300} />
            <Text className="text-base font-semibold text-gray-500 mt-3 text-center">
              No users found
            </Text>
          </View>
        ) : (
          <View className="px-4 pt-3 pb-6 gap-2">
            {filtered.map((u) => (
              <UserListItem
                key={u.id}
                user={u}
                onPress={() => navigation.navigate('UserDetail', { userId: u.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserListItem({ user, onPress }: { user: UserRow; onPress: () => void }) {
  const roleColor = ROLE_COLORS[user.role] ?? Colors.gray500;
  const statusColor = STATUS_COLORS[user.status] ?? Colors.gray500;
  const roleLabel =
    user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const statusLabel: Record<string, string> = {
    active: 'Active',
    suspended: 'Suspended',
    pending_verification: 'Pending',
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white rounded-xl border border-gray-100 px-4 py-3 gap-3 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`View ${user.name}`}
    >
      {user.profile_image_url ? (
        <Image
          source={{ uri: user.profile_image_url }}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
        />
      ) : (
        <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <User size={20} color={Colors.gray400} />
        </View>
      )}

      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {user.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {user.email}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${roleColor}20` }}>
            <Text className="text-xs font-medium" style={{ color: roleColor }}>
              {roleLabel}
            </Text>
          </View>
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            <Text className="text-xs font-medium" style={{ color: statusColor }}>
              {statusLabel[user.status] ?? user.status}
            </Text>
          </View>
        </View>
      </View>

      <ChevronRight size={16} color={Colors.gray300} />
    </Pressable>
  );
}
