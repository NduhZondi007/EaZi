import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useWallet } from '@/hooks/useWallet';
import type { WalletStackScreenProps } from '@/types/navigation.types';

type Props = WalletStackScreenProps<'TopUp'>;

const QUICK_AMOUNTS = [50, 100, 200, 500];

export function TopUpScreen({ navigation }: Props) {
  const { topUp, isPaymentProcessing, wallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [inputError, setInputError] = useState('');

  const parsedAmount = parseFloat(amount);
  const isValid = !isNaN(parsedAmount) && parsedAmount >= 10 && parsedAmount <= 10000;

  const handleAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    setInputError('');
  }, []);

  const handleQuickSelect = useCallback((value: number) => {
    setAmount(String(value));
    setInputError('');
  }, []);

  const handleTopUp = useCallback(async () => {
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      setInputError('Minimum top-up amount is R10.00');
      return;
    }
    if (parsedAmount > 10000) {
      setInputError('Maximum top-up amount is R10,000.00');
      return;
    }

    const result = await topUp(parsedAmount);

    if (!result) {
      Alert.alert('Top-Up Failed', 'Could not initiate top-up. Please try again.');
      return;
    }

    navigation.navigate('WebView', {
      url: result.checkoutUrl,
      title: 'Complete Payment',
    });
  }, [parsedAmount, topUp, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="mr-3">
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900">Top Up Wallet</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Current balance */}
        {wallet && (
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
              Current Balance
            </Text>
            <Text className="text-2xl font-bold text-gray-900">
              R{wallet.balance.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Quick amounts */}
        <Text className="text-sm font-semibold text-gray-700 mb-3">Quick Select</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {QUICK_AMOUNTS.map((value) => (
            <Pressable
              key={value}
              onPress={() => handleQuickSelect(value)}
              className={[
                'px-5 py-2.5 rounded-xl border-2',
                parsedAmount === value
                  ? 'border-[#111111] bg-[#111111]'
                  : 'border-gray-200 bg-white',
              ].join(' ')}
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
        </View>

        {/* Custom amount */}
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Or enter custom amount
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
          <Text className="text-xs text-gray-400 mt-1">Min R10 · Max R10,000</Text>
        )}

        {/* Payment note */}
        <View className="bg-blue-50 rounded-xl p-3 mt-6 mb-8">
          <Text className="text-xs text-blue-700 leading-4">
            🔒 Payments are processed securely via Yoco. Your card details are never stored on EaZi servers.
          </Text>
        </View>
      </ScrollView>

      <View className="px-4 pb-4 border-t border-gray-100 pt-3">
        <Button
          label={isPaymentProcessing ? 'Processing…' : `Top Up R${isValid ? parsedAmount.toFixed(2) : '0.00'}`}
          onPress={handleTopUp}
          isLoading={isPaymentProcessing}
          disabled={!isValid || isPaymentProcessing}
        />
      </View>
    </SafeAreaView>
  );
}
