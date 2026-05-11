import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, Star, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { cardRepository } from '@/repositories/card.repository';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { CardRow } from '@/types/database.types';
import type { WalletStackScreenProps } from '@/types/navigation.types';

type Props = WalletStackScreenProps<'SavedCards'>;

const BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
};

export function SavedCardsScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await cardRepository.findByUserId(profile.id);
      setCards(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetDefault = useCallback(
    (card: CardRow) => {
      if (!profile?.id) return;
      Alert.alert(
        'Set as Default',
        `Set ${BRAND_LABELS[card.brand.toLowerCase()] ?? card.brand} ••••${card.last4} as your default payment card?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Default',
            onPress: async () => {
              setIsActing(true);
              try {
                await cardRepository.setDefault(card.id, profile.id);
                setCards((prev) =>
                  prev.map((c) => ({ ...c, is_default: c.id === card.id })),
                );
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update card');
              } finally {
                setIsActing(false);
              }
            },
          },
        ],
      );
    },
    [profile?.id],
  );

  const handleDelete = useCallback((card: CardRow) => {
    Alert.alert(
      'Remove Card',
      `Remove ${BRAND_LABELS[card.brand.toLowerCase()] ?? card.brand} ••••${card.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsActing(true);
            try {
              await cardRepository.delete(card.id);
              setCards((prev) => prev.filter((c) => c.id !== card.id));
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to remove card');
            } finally {
              setIsActing(false);
            }
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          className="mr-3"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900">Saved Cards</Text>
        {isActing && <ActivityIndicator size="small" color={Colors.primary} />}
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
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {isLoading && cards.length === 0 ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : cards.length === 0 ? (
          <View className="mt-16 items-center px-8">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
              <CreditCard size={30} color={Colors.gray400} />
            </View>
            <Text className="text-base font-semibold text-gray-700 text-center">
              No saved cards
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-1">
              Cards saved during checkout will appear here.
            </Text>
          </View>
        ) : (
          <View className="mx-4 mt-4">
            <View className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              {cards.map((card, idx) => (
                <View key={card.id}>
                  <SavedCardRow
                    card={card}
                    onSetDefault={!card.is_default ? () => handleSetDefault(card) : undefined}
                    onDelete={() => handleDelete(card)}
                  />
                  {idx < cards.length - 1 && (
                    <View className="h-px bg-gray-100 mx-4" />
                  )}
                </View>
              ))}
            </View>

            <View className="mt-4 p-3 bg-blue-50 rounded-xl">
              <Text className="text-xs text-blue-700 leading-4">
                Cards are saved securely by Yoco. EaZi never stores your full card number.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SavedCardRow({
  card,
  onSetDefault,
  onDelete,
}: {
  card: CardRow;
  onSetDefault?: () => void;
  onDelete: () => void;
}) {
  const brandLabel = BRAND_LABELS[card.brand.toLowerCase()] ?? card.brand;
  const expLabel = `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`;

  return (
    <View className="flex-row items-center px-4 py-4 gap-3">
      <View className="w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center">
        <CreditCard size={18} color={Colors.gray600} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-gray-900">
            {brandLabel} ••••{card.last4}
          </Text>
          {card.is_default && (
            <View className="bg-[#111111] rounded-full px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white tracking-wide">DEFAULT</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-400 mt-0.5">Expires {expLabel}</Text>
      </View>

      <View className="flex-row items-center gap-1">
        {onSetDefault && (
          <Pressable
            onPress={onSetDefault}
            hitSlop={8}
            className="w-8 h-8 items-center justify-center rounded-lg active:bg-gray-100"
            accessibilityRole="button"
            accessibilityLabel="Set as default card"
          >
            <Star size={16} color={Colors.gray400} />
          </Pressable>
        )}
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          className="w-8 h-8 items-center justify-center rounded-lg active:bg-red-50"
          accessibilityRole="button"
          accessibilityLabel="Remove card"
        >
          <Trash2 size={16} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );
}
