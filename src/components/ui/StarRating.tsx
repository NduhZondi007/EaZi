import React from 'react';
import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface StarRatingProps {
  value: number;
  maxStars?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export const StarRating = React.memo(function StarRating({
  value,
  maxStars = 5,
  size = 24,
  color = Colors.warning,
  emptyColor = Colors.gray200,
  onRate,
  readonly = false,
}: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View className="flex-row gap-1">
      {stars.map((star) => {
        const filled = star <= value;
        const content = (
          <Star
            key={star}
            size={size}
            color={filled ? color : emptyColor}
            fill={filled ? color : 'transparent'}
          />
        );

        if (readonly || !onRate) {
          return <View key={star}>{content}</View>;
        }

        return (
          <Pressable
            key={star}
            onPress={() => onRate(star)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
});
