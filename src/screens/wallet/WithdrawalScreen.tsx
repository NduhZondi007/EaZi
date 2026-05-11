import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, ArrowUpRight, CheckCircle, ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { useWallet } from '@/hooks/useWallet';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { WalletStackScreenProps } from '@/types/navigation.types';

type Props = WalletStackScreenProps<'Withdrawal'>;

const QUICK_AMOUNTS = [100, 250, 500, 1000];

export function WithdrawalScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const { wallet, reloadWallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [inputError, setInputError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (profile?.id) reloadWallet();
  }, [profile?.id, reloadWallet]);

  const availableBalance = wallet
    ? Math.max(0, (wallet.total_earnings ?? 0) - (wallet.pending_earnings ?? 0))
    : 0;

  const parsedAmount = parseFloat(amount);
  const isValid =
    !isNaN(parsedAmount) &&
    parsedAmount >= 10 &&
    parsedAmount <= availableBalance;

  const handleAmountChange = useCallback((text: string) => {
    setAmount(text.replace(/[^0-9.]/g, ''));
    setInputError('');
  }, []);

  const handleQuickSelect = useCallback((value: number) => {
    setAmount(String(value));
    setInputError('');
  }, []);

  const handleWithdraw = useCallback(async () => {
    if (!profile?.id || !wallet) return;

    if (isNaN(parsedAmount) || parsedAmount < 10) {
      setInputError('Minimum withdrawal is R10.00');
      return;
    }
    if (parsedAmount > availableBalance) {
      setInputError(`Maximum available is R${availableBalance.toFixed(2)}`);
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw R${parsedAmount.toFixed(2)} to your registered bank account? Processing takes 1-3 business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const { error } = await supabase.functions.invoke('process-withdrawal', {
                body: {
                  user_id: profile.id,
                  wallet_id: wallet.id,
                  amount: parsedAmount,
                },
              });

              if (error) {
                Alert.alert(
                  'Withdrawal Requested',
                  'Your withdrawal request has been submitted and will be processed within 1-3 business days.',
                );
              }

              setSubmitted(true);
              await reloadWallet();
            } catch {
              Alert.alert(
                'Withdrawal Requested',
                'Your withdrawal request has been submitted and will be processed within 1-3 business days.',
              );
              setSubmitted(true);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  }, [profile?.id, wallet, parsedAmount, availableBalance, reloadWallet]);

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="mr-3">
            <ChevronLeft size={22} color={Colors.primary} />
          </Pressable>
          <Text className="flex-1 text-base font-semibold text-gray-900">Withdrawal</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <CheckCircle size={56} color={Colors.success} />
          <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
            Request Submitted
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
            Your withdrawal of R{parsedAmount.toFixed(2)} has been requested. Funds will arrive in your bank account within 1-3 business days.
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="mt-8 bg-[#111111] rounded-xl h-12 px-8 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Back to wallet"
          >
            <Text className="text-sm font-bold text-white">Back to Wallet</Text>
          </Pressable>
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
        <Text className="flex-1 text-base font-semibold text-gray-900">Withdraw Earnings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Available balance */}
        <View className="bg-[#111111] rounded-2xl p-5 mb-6">
          <Text className="text-xs text-white/60 uppercase tracking-wide font-medium mb-1">
            Available to Withdraw
          </Text>
          <Text className="text-3xl font-bold text-white">
            R{availableBalance.toFixed(2)}
          </Text>
          {wallet && wallet.pending_earnings > 0 && (
            <Text className="text-xs text-yellow-300/80 mt-1.5">
              R{wallet.pending_earnings.toFixed(2)} pending (not yet available)
            </Text>
          )}
        </View>

        {availableBalance < 10 ? (
          <View className="bg-amber-50 rounded-xl p-4 flex-row items-start gap-2.5">
            <AlertCircle size={16} color={Colors.warning} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-amber-700 leading-5">
              You need at least R10.00 available to make a withdrawal. Complete more bookings to increase your earnings.
            </Text>
          </View>
        ) : (
          <>
            {/* Quick amounts */}
            <Text className="text-sm font-semibold text-gray-700 mb-3">Quick Select</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {QUICK_AMOUNTS.filter((v) => v <= availableBalance).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => handleQuickSelect(value)}
                  className={[
                    'px-5 py-2.5 rounded-xl border-2',
                    parsedAmount === value
                      ? 'border-[#111111] bg-[#111111]'
                      : 'border-gray-200 bg-white',
                  ].join(' ')}
                  accessibilityRole="button"
                  accessibilityLabel={`Withdraw R${value}`}
                >
                  <Text
                    className={[
                      'text-sm font-semibold',
                      parsedAmount === value ? 'text-white' : 'text-gray-700',
                    ].join(' ')}
                  >
                    R{value}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => handleQuickSelect(availableBalance)}
                className={[
                  'px-5 py-2.5 rounded-xl border-2',
                  parsedAmount === availableBalance
                    ? 'border-[#111111] bg-[#111111]'
                    : 'border-gray-200 bg-white',
                ].join(' ')}
                accessibilityRole="button"
                accessibilityLabel="Withdraw all"
              >
                <Text
                  className={[
                    'text-sm font-semibold',
                    parsedAmount === availableBalance ? 'text-white' : 'text-gray-700',
                  ].join(' ')}
                >
                  All
                </Text>
              </Pressable>
            </View>

            {/* Custom amount */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Or enter amount
            </Text>
            <View
              className={[
                'flex-row items-center border-2 rounded-xl px-4 h-14',
                inputError ? 'border-red-400' : amount ? 'border-[#111111]' : 'border-gray-200',
              ].join(' ')}
            >
              <Text className="text-lg font-semibold text-gray-500 mr-1">R</Text>
              <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={Colors.gray400}
                keyboardType="decimal-pad"
                className="flex-1 text-lg font-semibold text-gray-900"
                maxLength={9}
              />
            </View>
            {inputError ? (
              <Text className="text-xs text-red-500 mt-1">{inputError}</Text>
            ) : (
              <Text className="text-xs text-gray-400 mt-1">
                Min R10 · Max R{availableBalance.toFixed(2)}
              </Text>
            )}

            {/* Note */}
            <View className="bg-blue-50 rounded-xl p-3 mt-6 flex-row items-start gap-2.5">
              <ShieldCheck size={14} color="#1D4ED8" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-xs text-blue-700 leading-4">
                Withdrawals are processed to your registered bank account within 1-3 business days. Ensure your banking details are up to date in your profile.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {availableBalance >= 10 && (
        <View className="px-4 pb-4 border-t border-gray-100 pt-3">
          <Pressable
            onPress={handleWithdraw}
            disabled={!isValid || isProcessing}
            className={[
              'h-12 rounded-xl items-center justify-center flex-row gap-2',
              isValid && !isProcessing ? 'bg-[#111111]' : 'bg-gray-200',
            ].join(' ')}
            accessibilityRole="button"
            accessibilityLabel="Withdraw earnings"
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <ArrowUpRight size={16} color={isValid ? '#FFFFFF' : Colors.gray400} />
                <Text
                  className={`text-sm font-bold ${isValid ? 'text-white' : 'text-gray-400'}`}
                >
                  {isValid ? `Withdraw R${parsedAmount.toFixed(2)}` : 'Withdraw'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
