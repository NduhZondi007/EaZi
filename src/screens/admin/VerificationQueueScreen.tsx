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
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { ChevronRight, FileText, ShieldCheck, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import type { ProviderVerification } from '@/repositories/admin.repository';
import type { AdminVerificationStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<AdminVerificationStackParamList>;

export function VerificationQueueScreen() {
  const navigation = useNavigation<Nav>();
  const [verifications, setVerifications] = useState<ProviderVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.listPendingVerifications();
      setVerifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load verifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <ShieldCheck size={18} color={Colors.primary} />
          <Text className="text-lg font-bold text-gray-900">Verification Queue</Text>
          {verifications.length > 0 && (
            <View className="ml-auto bg-amber-100 rounded-full px-2 py-0.5">
              <Text className="text-xs font-medium text-amber-700">{verifications.length}</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-500 mt-0.5">
          Review and approve pending provider applications
        </Text>
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
        {isLoading && verifications.length === 0 ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : verifications.length === 0 ? (
          <View className="mt-16 items-center px-8">
            <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-3">
              <ShieldCheck size={32} color={Colors.success} />
            </View>
            <Text className="text-base font-semibold text-gray-700 text-center">
              Queue is clear
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-1">
              No pending provider verifications
            </Text>
          </View>
        ) : (
          <View className="px-4 pt-3 pb-6 gap-2">
            {verifications.map((v) => (
              <VerificationCard
                key={v.user.id}
                verification={v}
                onPress={() =>
                  navigation.navigate('VerificationDetail', { providerId: v.user.id })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VerificationCard({
  verification,
  onPress,
}: {
  verification: ProviderVerification;
  onPress: () => void;
}) {
  const { user, documents } = verification;
  const earliestDoc = documents.reduce(
    (oldest, doc) =>
      new Date(doc.submitted_at) < new Date(oldest.submitted_at) ? doc : oldest,
    documents[0],
  );
  const submittedLabel = earliestDoc
    ? format(new Date(earliestDoc.submitted_at), 'dd MMM yyyy')
    : '—';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white rounded-xl border border-gray-100 px-4 py-3 gap-3 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`Review verification for ${user.name}`}
    >
      {user.profile_image_url ? (
        <Image
          source={{ uri: user.profile_image_url }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
          <User size={22} color={Colors.gray400} />
        </View>
      )}

      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {user.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
          {user.email}
        </Text>
        <View className="flex-row items-center gap-3 mt-1.5">
          <View className="flex-row items-center gap-1">
            <FileText size={11} color={Colors.warning} />
            <Text className="text-xs text-gray-500">
              {documents.length} doc{documents.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">Submitted {submittedLabel}</Text>
        </View>
      </View>

      <View className="items-center">
        <View className="bg-amber-100 rounded-full px-2 py-0.5 mb-1">
          <Text className="text-xs font-medium text-amber-700">Pending</Text>
        </View>
        <ChevronRight size={16} color={Colors.gray300} />
      </View>
    </Pressable>
  );
}
