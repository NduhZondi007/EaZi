import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { BadgeCheck, Briefcase, ChevronLeft, Phone } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { serviceDiscoveryFacade } from '@/services/service-discovery.facade';
import type { ProviderWithServices } from '@/types/service.types';
import type { ServiceRow } from '@/types/database.types';
import type { HomeStackScreenProps } from '@/types/navigation.types';

type Props = HomeStackScreenProps<'ProviderProfile'>;

function ServiceListItem({
  service,
  onPress,
}: {
  service: ServiceRow;
  onPress: () => void;
}) {
  const imageUrl = service.gallery?.[0] ?? null;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white rounded-xl p-3 mb-3 border border-gray-100"
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 72, height: 72, borderRadius: 10 }}
          contentFit="cover"
        />
      ) : (
        <View className="w-18 h-18 rounded-xl bg-gray-100 items-center justify-center" style={{ width: 72, height: 72 }}>
          <Briefcase size={24} color={Colors.gray400} />
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-xs text-gray-500 mb-0.5" numberOfLines={1}>
          {service.service_type}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
          {service.title}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-bold text-gray-900">
              R{service.base_price.toFixed(0)}
            </Text>
          </View>
          {service.is_available ? (
            <View className="bg-green-50 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-green-600">Available</Text>
            </View>
          ) : (
            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-gray-400">Unavailable</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function ProviderProfileScreen({ route, navigation }: Props) {
  const { providerId } = route.params;
  const [provider, setProvider] = useState<ProviderWithServices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = () => {
    setIsLoading(true);
    setError(null);
    serviceDiscoveryFacade
      .getProviderProfile(providerId)
      .then((data) => {
        if (!data) {
          setError('Provider not found');
        } else {
          setProvider(data);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [providerId]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !provider) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Pressable onPress={() => navigation.goBack()} className="p-4">
          <ChevronLeft size={24} color={Colors.primary} />
        </Pressable>
        <ErrorState
          title="Provider unavailable"
          message={error ?? 'This provider could not be loaded'}
          onRetry={loadProfile}
        />
      </SafeAreaView>
    );
  }

  const activeServices = provider.services.filter((s) => s.is_available);
  const allServices = provider.services;

  const Header = (
    <View>
      {/* Back button */}
      <Pressable onPress={() => navigation.goBack()} className="p-4">
        <ChevronLeft size={24} color={Colors.primary} />
      </Pressable>

      {/* Provider hero */}
      <View className="items-center px-6 pb-6 border-b border-gray-100">
        {provider.profile_image_url ? (
          <Image
            source={{ uri: provider.profile_image_url }}
            style={{ width: 96, height: 96, borderRadius: 48 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
            <Text className="text-3xl font-bold text-gray-500">
              {provider.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-2 mt-3">
          <Text className="text-xl font-bold text-gray-900">{provider.name}</Text>
          {provider.is_verified && (
            <BadgeCheck size={20} color={Colors.accent} />
          )}
        </View>
        {provider.is_verified && (
          <View className="flex-row items-center gap-1 mt-1">
            <Text className="text-xs text-green-600 font-medium">Verified Provider</Text>
          </View>
        )}
        {provider.bio && (
          <Text className="text-sm text-gray-500 text-center mt-3 leading-5">
            {provider.bio}
          </Text>
        )}
        {provider.phone && (
          <View className="flex-row items-center gap-2 mt-3">
            <Phone size={14} color={Colors.gray400} />
            <Text className="text-sm text-gray-500">{provider.phone}</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View className="flex-row px-6 py-4 border-b border-gray-100">
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-900">{allServices.length}</Text>
          <Text className="text-xs text-gray-400">Services</Text>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-900">{activeServices.length}</Text>
          <Text className="text-xs text-gray-400">Active</Text>
        </View>
      </View>

      {/* Services heading */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-base font-semibold text-gray-900">Services Offered</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <FlashList
        data={allServices}
        renderItem={({ item }) => (
          <ServiceListItem
            service={item}
            onPress={() =>
              navigation.navigate('ServiceDetail', { serviceId: item.id })
            }
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          <EmptyState
            icon={<Briefcase size={40} color={Colors.gray400} />}
            title="No services yet"
            subtitle="This provider has not listed any services"
          />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}
