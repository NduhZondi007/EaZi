import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Calendar, Clock } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Colors } from '@/constants/colors';
import type { BookingWithDetails } from '@/types/booking.types';

interface Props {
  booking: BookingWithDetails;
  onPress: (booking: BookingWithDetails) => void;
}

export const BookingCard = React.memo(function BookingCard({ booking, onPress }: Props) {
  const thumbnail = booking.service.gallery?.[0];
  const dateLabel = format(parseISO(booking.date), 'MMM d, yyyy');
  const timeLabel = booking.time.slice(0, 5);

  return (
    <Pressable
      onPress={() => onPress(booking)}
      className="bg-white border border-gray-100 rounded-xl mx-4 mb-3 overflow-hidden active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`Booking for ${booking.service.business_name}`}
    >
      <View className="flex-row p-4">
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={{ width: 64, height: 64, borderRadius: 10 }}
            contentFit="cover"
          />
        ) : (
          <View
            className="bg-gray-100 items-center justify-center"
            style={{ width: 64, height: 64, borderRadius: 10 }}
          >
            <Text style={{ fontSize: 24 }}>🛠</Text>
          </View>
        )}

        <View className="flex-1 ml-3">
          <View className="flex-row items-start justify-between mb-1">
            <Text
              className="text-sm font-semibold text-gray-900 flex-1 mr-2"
              numberOfLines={1}
            >
              {booking.service.business_name}
            </Text>
            <BookingStatusBadge status={booking.status} size="sm" />
          </View>

          <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>
            {booking.service.title}
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Calendar size={12} color={Colors.gray400} />
              <Text className="text-xs text-gray-500">{dateLabel}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color={Colors.gray400} />
              <Text className="text-xs text-gray-500">{timeLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="border-t border-gray-50 px-4 py-2 flex-row items-center justify-between">
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          by {booking.provider.name}
        </Text>
        <Text className="text-sm font-bold text-gray-900">
          R{booking.amount.toFixed(0)}
        </Text>
      </View>
    </Pressable>
  );
});
