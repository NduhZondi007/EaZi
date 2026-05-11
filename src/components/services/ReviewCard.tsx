import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { StarRating } from '@/components/ui/StarRating';
import { Colors } from '@/constants/colors';
import type { ReviewWithUser } from '@/types/service.types';

interface Props {
  review: ReviewWithUser;
}

export const ReviewCard = React.memo(function ReviewCard({ review }: Props) {
  return (
    <View className="bg-white rounded-xl border border-gray-100 p-4">
      <View className="flex-row items-start gap-3 mb-3">
        {review.user.profile_image_url ? (
          <Image
            source={{ uri: review.user.profile_image_url }}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
            <User size={18} color={Colors.gray400} />
          </View>
        )}

        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">{review.user.name}</Text>
          <View className="mt-0.5">
            <StarRating value={review.rating} size={14} readonly />
          </View>
        </View>
      </View>

      {review.comment ? (
        <Text className="text-sm text-gray-700 leading-5">{review.comment}</Text>
      ) : null}
    </View>
  );
});
