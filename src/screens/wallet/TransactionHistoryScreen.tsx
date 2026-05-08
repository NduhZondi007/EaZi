import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, Receipt } from 'lucide-react-native';
import { TransactionItem } from '@/components/wallet/TransactionItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';
import { useWallet } from '@/hooks/useWallet';
import type { WalletStackScreenProps } from '@/types/navigation.types';
import type { TransactionRow } from '@/types/database.types';

type Props = WalletStackScreenProps<'TransactionHistory'>;

export function TransactionHistoryScreen({ navigation }: Props) {
  const { transactions, isLoading, reload } = useWallet();

  const renderItem = useCallback(
    ({ item }: { item: TransactionRow }) => <TransactionItem transaction={item} />,
    [],
  );

  const keyExtractor = useCallback((item: TransactionRow) => item.id, []);

  const renderSeparator = useCallback(
    () => <View className="h-px bg-gray-100 ml-[68px]" />,
    [],
  );

  if (isLoading && transactions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="mr-3">
            <ChevronLeft size={22} color={Colors.primary} />
          </Pressable>
          <Text className="flex-1 text-base font-semibold text-gray-900">
            Transaction History
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="mr-3">
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900">
          Transaction History
        </Text>
        <Text className="text-sm text-gray-400">{transactions.length} total</Text>
      </View>

      <FlashList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={renderSeparator}
        estimatedItemSize={66}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={reload}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Receipt size={40} color={Colors.gray400} />}
            title="No transactions yet"
            subtitle="Your payment history will appear here once you make a booking or top up your wallet."
          />
        }
      />
    </SafeAreaView>
  );
}
