import React from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BadgeCheck, Briefcase, Star } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { ServiceWithProvider } from '@/types/service.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const HORIZONTAL_CARD_WIDTH = 220;

interface ServiceCardProps {
  service: ServiceWithProvider;
  onPress: () => void;
  variant?: 'grid' | 'horizontal';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View className="flex-row items-center gap-1">
      <Star size={12} color={Colors.warning} fill={Colors.warning} />
      <Text className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</Text>
    </View>
  );
}

function ServiceImage({
  uri,
  width,
  height,
}: {
  uri: string | null;
  width: number;
  height: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width, height }}
        contentFit="cover"
        transition={200}
      />
    );
  }
  return (
    <View
      style={{ width, height }}
      className="bg-gray-100 items-center justify-center"
    >
      <Briefcase size={32} color={Colors.gray400} />
    </View>
  );
}

export const ServiceCard = React.memo(function ServiceCard({
  service,
  onPress,
  variant = 'grid',
}: ServiceCardProps) {
  const imageUrl = service.gallery?.[0] ?? null;
  const providerName = service.provider?.name ?? 'Provider';
  const isVerified = service.provider?.is_verified ?? false;

  if (variant === 'horizontal') {
    return (
      <Pressable
        onPress={onPress}
        style={{ width: HORIZONTAL_CARD_WIDTH }}
        className="mr-3 rounded-xl overflow-hidden bg-white border border-gray-100"
        accessibilityRole="button"
        accessibilityLabel={service.title}
      >
        <ServiceImage uri={imageUrl} width={HORIZONTAL_CARD_WIDTH} height={140} />
        <View className="p-3">
          <Text className="text-xs text-gray-500 mb-0.5" numberOfLines={1}>
            {service.service_type}
          </Text>
          <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={1}>
            {service.title}
          </Text>
          <View className="flex-row items-center justify-between">
            <StarRating rating={service.avg_rating} />
            <Text className="text-sm font-bold text-gray-900">
              R{service.base_price.toFixed(0)}
            </Text>
          </View>
          <View className="flex-row items-center mt-2 gap-1">
            {isVerified && <BadgeCheck size={12} color={Colors.accent} />}
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {providerName}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{ width: GRID_CARD_WIDTH, margin: 8 }}
      className="rounded-xl overflow-hidden bg-white border border-gray-100"
      accessibilityRole="button"
      accessibilityLabel={service.title}
    >
      <ServiceImage uri={imageUrl} width={GRID_CARD_WIDTH} height={110} />
      <View className="p-2.5">
        <Text className="text-xs text-gray-500 mb-0.5" numberOfLines={1}>
          {service.service_type}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
          {service.title}
        </Text>
        <View className="flex-row items-center justify-between">
          <StarRating rating={service.avg_rating} />
          <Text className="text-xs font-bold text-gray-900">
            R{service.base_price.toFixed(0)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
