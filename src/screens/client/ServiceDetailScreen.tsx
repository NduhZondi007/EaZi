import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  BadgeCheck,
  Calendar,
  ChevronLeft,
  Clock,
  ExternalLink,
  Globe,
  MessageCircle,
  Star,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ErrorState } from '@/components/ui/ErrorState';
import { serviceDiscoveryFacade } from '@/services/service-discovery.facade';
import type {
  OperatingHours,
  ReviewWithUser,
  ServiceWithDetails,
  SocialLinks,
} from '@/types/service.types';
import type { HomeStackScreenProps } from '@/types/navigation.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAY_ORDER: (keyof OperatingHours)[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const DAY_LABELS: Record<keyof OperatingHours, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

type Props = HomeStackScreenProps<'ServiceDetail'>;

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          color={Colors.warning}
          fill={s <= Math.round(rating) ? Colors.warning : 'transparent'}
        />
      ))}
      <Text className="text-sm text-gray-600 ml-1">
        {rating.toFixed(1)} ({count})
      </Text>
    </View>
  );
}

function ReviewCard({ review }: { review: ReviewWithUser }) {
  return (
    <View className="mb-4 pb-4 border-b border-gray-100">
      <View className="flex-row items-center gap-2 mb-2">
        {review.user.profile_image_url ? (
          <Image
            source={{ uri: review.user.profile_image_url }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
            <Text className="text-xs font-semibold text-gray-500">
              {review.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View>
          <Text className="text-sm font-semibold text-gray-900">{review.user.name}</Text>
          <View className="flex-row">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={12}
                color={Colors.warning}
                fill={s <= review.rating ? Colors.warning : 'transparent'}
              />
            ))}
          </View>
        </View>
      </View>
      <Text className="text-sm text-gray-600 leading-5">{review.comment}</Text>
    </View>
  );
}

function OperatingHoursTable({ hours }: { hours: OperatingHours }) {
  return (
    <View>
      {DAY_ORDER.map((day) => {
        const info = hours[day];
        if (!info) return null;
        return (
          <View key={day} className="flex-row justify-between py-2 border-b border-gray-50">
            <Text className="text-sm text-gray-600" style={{ width: 100 }}>
              {DAY_LABELS[day]}
            </Text>
            {info.closed ? (
              <Text className="text-sm text-gray-400">Closed</Text>
            ) : (
              <Text className="text-sm text-gray-900">
                {info.open} – {info.close}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const SOCIAL_PLATFORMS: { key: keyof SocialLinks; label: string }[] = [
  { key: 'twitter', label: 'Twitter/X' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'website', label: 'Website' },
];

function SocialLinkButtons({ links }: { links: SocialLinks }) {
  const open = (url: string) => Linking.openURL(url).catch(() => null);
  const available = SOCIAL_PLATFORMS.filter(({ key }) => !!links[key]);
  if (available.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-2">
      {available.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => open(links[key]!)}
          className="flex-row items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg"
        >
          {key === 'website' ? (
            <Globe size={14} color={Colors.gray500} />
          ) : (
            <ExternalLink size={14} color={Colors.gray500} />
          )}
          <Text className="text-sm text-gray-600">{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ServiceDetailScreen({ route, navigation }: Props) {
  const { serviceId } = route.params;
  const [service, setService] = useState<ServiceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const loadDetail = useCallback(() => {
    setIsLoading(true);
    setError(null);
    serviceDiscoveryFacade
      .getServiceDetail(serviceId)
      .then((data) => {
        if (!data) setError('Service not found');
        else setService(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [serviceId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleBookNow = useCallback(() => {
    // BookingModal implemented in Phase 5
  }, []);

  const handleChat = useCallback(() => {
    // ChatRoom implemented in Phase 8
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Pressable onPress={() => navigation.goBack()} className="p-4">
          <ChevronLeft size={24} color={Colors.primary} />
        </Pressable>
        <ErrorState
          title="Service unavailable"
          message={error ?? 'This service could not be loaded'}
          onRetry={loadDetail}
        />
      </SafeAreaView>
    );
  }

  const gallery = service.gallery?.length > 0 ? service.gallery : [];
  const operatingHours = service.operating_hours as unknown as OperatingHours | null;
  const socialLinks = service.social_links as unknown as SocialLinks | null;
  const hasSocialLinks =
    socialLinks &&
    (socialLinks.twitter ||
      socialLinks.facebook ||
      socialLinks.instagram ||
      socialLinks.website);
  const provider = service.provider;
  const reviews = service.reviews?.slice(0, 3) ?? [];

  return (
    <View className="flex-1 bg-white">
      {/* Back button floating over gallery */}
      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 z-10">
        <Pressable
          onPress={() => navigation.goBack()}
          className="m-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center"
        >
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery carousel */}
        {gallery.length > 0 ? (
          <View>
            <FlatList
              data={gallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onMomentumScrollEnd={(e) => {
                setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: SCREEN_WIDTH, height: 280 }}
                  contentFit="cover"
                />
              )}
            />
            {gallery.length > 1 && (
              <View className="flex-row justify-center gap-1.5 absolute bottom-3 left-0 right-0">
                {gallery.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === galleryIndex ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === galleryIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ height: 280 }} className="bg-gray-100 items-center justify-center">
            <Text className="text-gray-400 text-sm">No images</Text>
          </View>
        )}

        <View className="px-4 pt-4 pb-8">
          {/* Header */}
          <View className="mb-4">
            <View className="flex-row items-start justify-between mb-1">
              <Text className="text-xl font-bold text-gray-900 flex-1 mr-4">
                {service.business_name}
              </Text>
              <View
                className={[
                  'px-2 py-0.5 rounded-full',
                  service.is_available ? 'bg-green-100' : 'bg-gray-100',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-xs font-medium',
                    service.is_available ? 'text-green-700' : 'text-gray-400',
                  ].join(' ')}
                >
                  {service.is_available ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-500 mb-3">{service.title}</Text>

            {/* Provider row */}
            <Pressable
              onPress={() =>
                navigation.navigate('ProviderProfile', { providerId: provider.id })
              }
              className="flex-row items-center gap-2"
            >
              {provider.profile_image_url ? (
                <Image
                  source={{ uri: provider.profile_image_url }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center">
                  <Text className="text-sm font-semibold text-gray-500">
                    {provider.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {provider.name}
                  </Text>
                  {provider.is_verified && (
                    <BadgeCheck size={14} color={Colors.accent} />
                  )}
                </View>
                <Text className="text-xs text-gray-400">View profile</Text>
              </View>
            </Pressable>
          </View>

          {/* Stats row */}
          <View className="flex-row items-center gap-6 mb-5 pb-4 border-b border-gray-100">
            <View>
              <Text className="text-xs text-gray-400 mb-1">Rating</Text>
              <StarRow rating={service.avg_rating} count={service.review_count} />
            </View>
            <View>
              <Text className="text-xs text-gray-400 mb-1">Starting from</Text>
              <Text className="text-base font-bold text-gray-900">
                R{service.base_price.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              About this service
            </Text>
            <Text className="text-sm text-gray-600 leading-6">{service.description}</Text>
          </View>

          {/* Operating hours */}
          {operatingHours && Object.keys(operatingHours).length > 0 && (
            <View className="mb-5">
              <View className="flex-row items-center gap-2 mb-3">
                <Clock size={16} color={Colors.gray500} />
                <Text className="text-sm font-semibold text-gray-900">
                  Operating Hours
                </Text>
              </View>
              <OperatingHoursTable hours={operatingHours} />
            </View>
          )}

          {/* Social links */}
          {hasSocialLinks && socialLinks && (
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-3">Connect</Text>
              <SocialLinkButtons links={socialLinks} />
            </View>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-gray-900">
                  Reviews ({service.review_count})
                </Text>
                {service.review_count > 3 && (
                  <Text className="text-sm text-gray-400">See all</Text>
                )}
              </View>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          )}

          {/* Space for sticky bar */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <SafeAreaView edges={['bottom']} className="bg-white border-t border-gray-100">
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable
            onPress={handleChat}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
            accessibilityLabel="Chat with provider"
          >
            <MessageCircle size={20} color={Colors.primary} />
          </Pressable>
          <Pressable
            onPress={handleBookNow}
            className="flex-1 h-11 rounded-xl bg-gray-100 items-center justify-center"
            accessibilityLabel="Schedule"
          >
            <View className="flex-row items-center gap-2">
              <Calendar size={16} color={Colors.primary} />
              <Text className="text-sm font-semibold text-gray-900">Schedule</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={handleBookNow}
            className="flex-1 h-11 rounded-xl bg-[#111111] items-center justify-center"
            accessibilityLabel="Book Now"
          >
            <Text className="text-sm font-semibold text-white">Book Now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
