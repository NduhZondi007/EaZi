import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Briefcase, Edit3, Plus, Star, Trash2, Wrench } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import {
  useProviderStore,
  selectMyServices,
  selectIsServicesLoading,
  selectIsActionLoading,
  selectProviderError,
} from '@/stores/provider.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { ServiceRow } from '@/types/database.types';
import type { ProviderServicesStackScreenProps } from '@/types/navigation.types';

type Props = ProviderServicesStackScreenProps<'MyServices'>;

export function MyServicesScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const services = useProviderStore(selectMyServices);
  const isLoading = useProviderStore(selectIsServicesLoading);
  const isActionLoading = useProviderStore(selectIsActionLoading);
  const error = useProviderStore(selectProviderError);
  const { loadMyServices, removeService, toggleAvailability } = useProviderStore();

  const load = useCallback(() => {
    if (profile?.id) loadMyServices(profile.id);
  }, [profile?.id, loadMyServices]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    (service: ServiceRow) => {
      Alert.alert(
        'Delete Service',
        `Delete "${service.title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeService(service.id),
          },
        ],
      );
    },
    [removeService],
  );

  const handleToggle = useCallback(
    (service: ServiceRow, value: boolean) => {
      toggleAvailability(service.id, value);
    },
    [toggleAvailability],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-base font-semibold text-gray-900">My Services</Text>
        <Pressable
          onPress={() => navigation.navigate('CreateService')}
          className="w-9 h-9 bg-[#111111] rounded-xl items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Create service"
        >
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {error ? (
        <View className="mx-4 mt-3 p-3 bg-red-50 rounded-xl">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} />
        }
        contentContainerClassName="flex-grow"
      >
        {isLoading && services.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : services.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <EmptyState
              icon={<Briefcase size={40} color={Colors.gray400} />}
              title="No services yet"
              subtitle="Create your first service listing to start receiving bookings"
              actionLabel="Create Service"
              onAction={() => navigation.navigate('CreateService')}
            />
          </View>
        ) : (
          <View className="px-4 pt-4 pb-8 gap-3">
            {(isActionLoading) && (
              <View className="py-2">
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => navigation.navigate('EditService', { serviceId: service.id })}
                onDelete={() => handleDelete(service)}
                onToggle={(value) => handleToggle(service, value)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ServiceCard = React.memo(function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggle,
}: {
  service: ServiceRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (value: boolean) => void;
}) {
  const thumbnail = service.gallery?.[0];

  return (
    <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <View className="flex-row">
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={{ width: 80, height: 80 }}
            contentFit="cover"
          />
        ) : (
          <View
            className="bg-gray-100 items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            <Wrench size={24} color={Colors.gray400} />
          </View>
        )}

        <View className="flex-1 p-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                {service.business_name}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                {service.title}
              </Text>
            </View>
            <View className="items-center">
              <Switch
                value={service.is_available}
                onValueChange={onToggle}
                trackColor={{ false: Colors.gray300, true: Colors.accent }}
                thumbColor="#FFFFFF"
                accessibilityLabel={service.is_available ? 'Disable service' : 'Enable service'}
              />
              <Text className="text-[9px] text-gray-400 mt-0.5">
                {service.is_available ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View>
              <Text className="text-sm font-bold text-gray-900">
                R{service.base_price.toFixed(0)}
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <Star size={10} color={Colors.warning} fill={Colors.warning} />
                <Text className="text-xs text-gray-500">
                  {service.avg_rating.toFixed(1)} ({service.review_count})
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={onEdit}
                className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Edit service"
              >
                <Edit3 size={14} color={Colors.gray600} />
              </Pressable>
              <Pressable
                onPress={onDelete}
                className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Delete service"
              >
                <Trash2 size={14} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View className="px-3 py-1.5 border-t border-gray-50">
        <Text className="text-xs text-gray-400">{service.service_type}</Text>
      </View>
    </View>
  );
});
