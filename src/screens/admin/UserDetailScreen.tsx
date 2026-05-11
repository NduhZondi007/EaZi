import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Mail,
  MapPin,
  Phone,
  ShieldOff,
  User,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import type { UserRow, UserStatus } from '@/types/database.types';
import type { AdminUsersStackScreenProps } from '@/types/navigation.types';

type Props = AdminUsersStackScreenProps<'UserDetail'>;

const ROLE_COLORS: Record<string, string> = {
  client: Colors.info,
  provider: Colors.success,
  admin: '#8B5CF6',
};

const STATUS_COLORS: Record<string, string> = {
  active: Colors.success,
  suspended: Colors.error,
  pending_verification: Colors.warning,
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  pending_verification: 'Pending Verification',
};

export function UserDetailScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const [user, setUser] = useState<UserRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getUserDetail(userId);
      setUser(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = useCallback(
    (newStatus: UserStatus) => {
      if (!user) return;
      const actionLabel = newStatus === 'suspended' ? 'Suspend' : 'Activate';
      const actionMsg =
        newStatus === 'suspended'
          ? `Suspend ${user.name}? They will not be able to access the platform.`
          : `Activate ${user.name}? They will regain access to the platform.`;

      Alert.alert(actionLabel + ' User', actionMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: newStatus === 'suspended' ? 'destructive' : 'default',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const updated = await adminRepository.updateUserStatus(userId, newStatus);
              setUser(updated);
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update status');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]);
    },
    [user, userId],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-9 h-9 rounded-xl items-center justify-center active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-gray-900 ml-2">User Detail</Text>
        {isUpdating && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      ) : !user ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-gray-500">User not found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 p-5 items-center">
            {user.profile_image_url ? (
              <Image
                source={{ uri: user.profile_image_url }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
                <User size={36} color={Colors.gray400} />
              </View>
            )}
            <Text className="text-lg font-bold text-gray-900 mt-3">{user.name}</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{user.email}</Text>
            <View className="flex-row gap-2 mt-3">
              <Pill
                label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                color={ROLE_COLORS[user.role] ?? Colors.gray500}
              />
              <Pill
                label={STATUS_LABELS[user.status] ?? user.status}
                color={STATUS_COLORS[user.status] ?? Colors.gray500}
              />
              {user.is_verified && (
                <Pill label="Verified" color={Colors.success} />
              )}
            </View>
          </View>

          {/* Details */}
          <View className="bg-white mx-4 mt-3 rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Account Info
            </Text>
            <DetailRow
              icon={<Mail size={16} color={Colors.gray400} />}
              label="Email"
              value={user.email}
            />
            {user.phone ? (
              <DetailRow
                icon={<Phone size={16} color={Colors.gray400} />}
                label="Phone"
                value={user.phone}
              />
            ) : null}
            {user.address ? (
              <DetailRow
                icon={<MapPin size={16} color={Colors.gray400} />}
                label="Address"
                value={user.address}
              />
            ) : null}
            <DetailRow
              icon={<Calendar size={16} color={Colors.gray400} />}
              label="Joined"
              value={format(new Date(user.created_at), 'dd MMM yyyy')}
            />
          </View>

          {/* Bio */}
          {user.bio ? (
            <View className="bg-white mx-4 mt-3 rounded-2xl border border-gray-100 p-4">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Bio
              </Text>
              <Text className="text-sm text-gray-700 leading-5">{user.bio}</Text>
            </View>
          ) : null}

          {/* Actions */}
          {user.role !== 'admin' ? (
            <View className="mx-4 mt-4 mb-8 gap-2">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Actions
              </Text>
              {user.status !== 'suspended' ? (
                <Pressable
                  onPress={() => handleStatusChange('suspended')}
                  disabled={isUpdating}
                  className="flex-row items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 active:opacity-75"
                  accessibilityRole="button"
                  accessibilityLabel="Suspend user"
                >
                  <ShieldOff size={18} color={Colors.error} />
                  <Text className="text-sm font-semibold text-red-600">Suspend User</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleStatusChange('active')}
                  disabled={isUpdating}
                  className="flex-row items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 active:opacity-75"
                  accessibilityRole="button"
                  accessibilityLabel="Activate user"
                >
                  <CheckCircle size={18} color={Colors.success} />
                  <Text className="text-sm font-semibold text-green-700">Activate User</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View className="h-8" />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
      <Text className="text-xs font-medium" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1">
        <Text className="text-xs text-gray-400">{label}</Text>
        <Text className="text-sm text-gray-900 mt-0.5">{value}</Text>
      </View>
    </View>
  );
}
