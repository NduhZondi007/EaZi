import React from 'react';
import { Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  RefreshCcw,
  Wallet,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { TransactionRow, TransactionType } from '@/types/database.types';

interface TransactionItemProps {
  transaction: TransactionRow;
}

const TRANSACTION_LABELS: Record<TransactionType, string> = {
  booking_payment: 'Booking Payment',
  wallet_topup: 'Wallet Top Up',
  withdrawal: 'Withdrawal',
  refund: 'Refund',
  eazi_cash_redemption: 'EaZi Cash Used',
};

function TransactionIcon({ type }: { type: TransactionType }) {
  const size = 18;
  switch (type) {
    case 'wallet_topup':
      return <ArrowDownLeft size={size} color={Colors.success} />;
    case 'withdrawal':
      return <ArrowUpRight size={size} color={Colors.error} />;
    case 'booking_payment':
      return <CreditCard size={size} color={Colors.info} />;
    case 'refund':
      return <RefreshCcw size={size} color={Colors.warning} />;
    case 'eazi_cash_redemption':
      return <Wallet size={size} color={Colors.accent} />;
  }
}

function amountColor(type: TransactionType): string {
  switch (type) {
    case 'wallet_topup':
    case 'refund':
      return Colors.success;
    case 'withdrawal':
    case 'booking_payment':
    case 'eazi_cash_redemption':
      return Colors.error;
    default:
      return Colors.primary;
  }
}

function amountPrefix(type: TransactionType): string {
  switch (type) {
    case 'wallet_topup':
    case 'refund':
      return '+';
    default:
      return '-';
  }
}

const STATUS_DOTS: Record<string, string> = {
  completed: Colors.success,
  pending: Colors.warning,
  failed: Colors.error,
  refunded: Colors.info,
};

export const TransactionItem = React.memo(function TransactionItem({
  transaction,
}: TransactionItemProps) {
  const dateLabel = format(parseISO(transaction.created_at), 'MMM d, h:mm a');
  const iconBg =
    transaction.type === 'wallet_topup' || transaction.type === 'refund'
      ? 'bg-green-50'
      : transaction.type === 'booking_payment'
        ? 'bg-blue-50'
        : transaction.type === 'withdrawal'
          ? 'bg-red-50'
          : 'bg-gray-50';

  return (
    <View className="flex-row items-center px-4 py-3.5 gap-3">
      <View className={`w-10 h-10 rounded-full items-center justify-center ${iconBg}`}>
        <TransactionIcon type={transaction.type} />
      </View>

      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {TRANSACTION_LABELS[transaction.type]}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: STATUS_DOTS[transaction.status] ?? Colors.gray400,
            }}
          />
          <Text className="text-xs text-gray-400">{dateLabel}</Text>
        </View>
      </View>

      <Text
        className="text-sm font-bold"
        style={{ color: amountColor(transaction.type) }}
      >
        {amountPrefix(transaction.type)}R{transaction.amount.toFixed(2)}
      </Text>
    </View>
  );
});
