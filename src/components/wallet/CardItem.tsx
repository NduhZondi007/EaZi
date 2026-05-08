import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CreditCard, Star } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { CardRow } from '@/types/database.types';

interface CardItemProps {
  card: CardRow;
  onSetDefault?: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
}

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
};

export const CardItem = React.memo(function CardItem({
  card,
  onSetDefault,
  onDelete,
}: CardItemProps) {
  const brandLabel = BRAND_LABELS[card.brand.toLowerCase()] ?? card.brand;
  const expLabel = `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`;

  return (
    <View className="flex-row items-center px-4 py-3 gap-3">
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
        <CreditCard size={18} color={Colors.gray600} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-semibold text-gray-900">
            {brandLabel} ••••{card.last4}
          </Text>
          {card.is_default && (
            <View className="bg-[#111111] rounded-full px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">DEFAULT</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-400 mt-0.5">Expires {expLabel}</Text>
      </View>

      <View className="flex-row gap-2">
        {!card.is_default && onSetDefault && (
          <Pressable
            onPress={() => onSetDefault(card.id)}
            hitSlop={8}
            className="p-1.5"
          >
            <Star size={16} color={Colors.gray400} />
          </Pressable>
        )}
        {onDelete && (
          <Pressable
            onPress={() => onDelete(card.id)}
            hitSlop={8}
            className="p-1.5"
          >
            <Text className="text-xs text-red-500 font-medium">Remove</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});
