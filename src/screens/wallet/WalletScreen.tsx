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
import { ArrowRight, CreditCard, Receipt } from 'lucide-react-native';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { CardItem } from '@/components/wallet/CardItem';
import { TransactionItem } from '@/components/wallet/TransactionItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Colors } from '@/constants/colors';
import { cardRepository } from '@/repositories/card.repository';
import { useWallet } from '@/hooks/useWallet';
import { useAuthStore, selectProfile, selectUser } from '@/stores/auth.store';
import type { CardRow } from '@/types/database.types';
import type { WalletStackScreenProps } from '@/types/navigation.types';

type Props = WalletStackScreenProps<'WalletMain'>;

const RECENT_LIMIT = 5;

export function WalletScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const user = useAuthStore(selectUser);
  const isProvider = profile?.role === 'provider';

  const { wallet, transactions, isLoading, error, reload, clearError } = useWallet();
  const [cards, setCards] = useState<CardRow[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    cardRepository.findByUserId(profile.id).then(setCards).catch(() => {});
  }, [profile?.id]);

  const recent = transactions.slice(0, RECENT_LIMIT);

  const handleTopUp = useCallback(() => {
    navigation.navigate('TopUp');
  }, [navigation]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('TransactionHistory');
  }, [navigation]);

  const handleWithdraw = useCallback(() => {
    navigation.navigate('Withdrawal');
  }, [navigation]);

  if (isLoading && !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900">Wallet</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900">Wallet</Text>
        </View>
        <ErrorState
          title="Wallet unavailable"
          message={error}
          onRetry={reload}
        />
      </SafeAreaView>
    );
  }

  if (!isLoading && !wallet && !error && user && !profile) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-900">Wallet</Text>
        </View>
        <ErrorState
          title="Session expired"
          message="Your session could not be verified. Please sign out and sign in again."
          onRetry={reload}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Wallet</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={reload}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Balance card */}
        <View className="pt-4 pb-6">
          {wallet ? (
            <BalanceCard
              balance={wallet.balance}
              eaziCashBalance={wallet.eazi_cash_balance}
              pendingEarnings={wallet.pending_earnings}
              onTopUp={handleTopUp}
              onWithdraw={isProvider ? handleWithdraw : undefined}
              isProvider={isProvider}
            />
          ) : (
            <View className="mx-4 h-36 bg-gray-100 rounded-2xl items-center justify-center">
              <Text className="text-sm text-gray-400">No wallet found</Text>
            </View>
          )}
        </View>

        {/* Saved Cards */}
        {cards.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-base font-bold text-gray-900">Saved Cards</Text>
              <Pressable
                onPress={() => navigation.navigate('SavedCards')}
                className="flex-row items-center gap-1"
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Manage saved cards"
              >
                <Text className="text-sm font-medium text-gray-500">Manage</Text>
                <ArrowRight size={14} color={Colors.gray500} />
              </Pressable>
            </View>
            <View className="bg-white rounded-2xl mx-4 overflow-hidden border border-gray-100">
              {cards.slice(0, 2).map((card, idx) => (
                <View key={card.id}>
                  <CardItem card={card} />
                  {idx < Math.min(cards.length, 2) - 1 && (
                    <View className="h-px bg-gray-100 ml-[68px]" />
                  )}
                </View>
              ))}
              {cards.length > 2 && (
                <Pressable
                  onPress={() => navigation.navigate('SavedCards')}
                  className="flex-row items-center justify-center gap-1 py-3 border-t border-gray-100"
                  accessibilityRole="button"
                  accessibilityLabel="View all cards"
                >
                  <CreditCard size={14} color={Colors.gray500} />
                  <Text className="text-sm font-semibold text-gray-700">
                    View all {cards.length} cards
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {cards.length === 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-base font-bold text-gray-900">Saved Cards</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('SavedCards')}
              className="mx-4 border border-dashed border-gray-200 rounded-2xl p-4 flex-row items-center gap-3 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Manage saved cards"
            >
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <CreditCard size={18} color={Colors.gray400} />
              </View>
              <View>
                <Text className="text-sm font-semibold text-gray-700">No saved cards</Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                  Cards added during checkout appear here
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Recent transactions */}
        <View>
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-base font-bold text-gray-900">Recent Activity</Text>
            {transactions.length > RECENT_LIMIT && (
              <Pressable
                onPress={handleViewAll}
                className="flex-row items-center gap-1"
                hitSlop={8}
              >
                <Text className="text-sm font-medium text-gray-500">See All</Text>
                <ArrowRight size={14} color={Colors.gray500} />
              </Pressable>
            )}
          </View>

          {recent.length === 0 ? (
            <EmptyState
              icon={<Receipt size={36} color={Colors.gray400} />}
              title="No transactions yet"
              subtitle="Your recent payments and top-ups will show here."
              actionLabel="Top Up Wallet"
              onAction={handleTopUp}
            />
          ) : (
            <View className="bg-white rounded-2xl mx-4 overflow-hidden border border-gray-100">
              {recent.map((tx, idx) => (
                <View key={tx.id}>
                  <TransactionItem transaction={tx} />
                  {idx < recent.length - 1 && (
                    <View className="h-px bg-gray-100 ml-[68px]" />
                  )}
                </View>
              ))}

              {transactions.length > RECENT_LIMIT && (
                <Pressable
                  onPress={handleViewAll}
                  className="flex-row items-center justify-center gap-1 py-3.5 border-t border-gray-100"
                >
                  <Text className="text-sm font-semibold text-gray-700">
                    View all {transactions.length} transactions
                  </Text>
                  <ArrowRight size={14} color={Colors.gray700} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
