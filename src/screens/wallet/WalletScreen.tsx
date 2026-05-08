import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Receipt } from 'lucide-react-native';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { TransactionItem } from '@/components/wallet/TransactionItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Colors } from '@/constants/colors';
import { useWallet } from '@/hooks/useWallet';
import { useAuthStore } from '@/stores/auth.store';
import type { WalletStackScreenProps } from '@/types/navigation.types';

type Props = WalletStackScreenProps<'WalletMain'>;

const RECENT_LIMIT = 5;

export function WalletScreen({ navigation }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const isProvider = profile?.role === 'provider';

  const { wallet, transactions, isLoading, error, reload, clearError } = useWallet();

  const recent = transactions.slice(0, RECENT_LIMIT);

  const handleTopUp = useCallback(() => {
    navigation.navigate('TopUp');
  }, [navigation]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('TransactionHistory');
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
              onWithdraw={isProvider ? () => {} : undefined}
              isProvider={isProvider}
            />
          ) : (
            <View className="mx-4 h-36 bg-gray-100 rounded-2xl items-center justify-center">
              <Text className="text-sm text-gray-400">No wallet found</Text>
            </View>
          )}
        </View>

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
