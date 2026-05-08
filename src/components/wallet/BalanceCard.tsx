import { Pressable, Text, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface BalanceCardProps {
  balance: number;
  eaziCashBalance: number;
  pendingEarnings?: number;
  onTopUp: () => void;
  onWithdraw?: () => void;
  isProvider?: boolean;
}

export function BalanceCard({
  balance,
  eaziCashBalance,
  pendingEarnings = 0,
  onTopUp,
  onWithdraw,
  isProvider = false,
}: BalanceCardProps) {
  return (
    <View className="mx-4 rounded-2xl overflow-hidden bg-[#111111]">
      {/* Main balance */}
      <View className="px-5 pt-5 pb-4">
        <View className="flex-row items-center gap-2 mb-1">
          <Wallet size={16} color="rgba(255,255,255,0.6)" />
          <Text className="text-xs text-white/60 font-medium tracking-wide uppercase">
            EaZi Wallet
          </Text>
        </View>
        <Text className="text-4xl font-bold text-white mt-1">
          R{balance.toFixed(2)}
        </Text>

        {eaziCashBalance > 0 && (
          <View className="flex-row items-center gap-1.5 mt-2">
            <View className="bg-[#3ECF8E]/20 rounded-full px-2.5 py-0.5">
              <Text className="text-xs text-[#3ECF8E] font-semibold">
                + R{eaziCashBalance.toFixed(2)} EaZi Cash
              </Text>
            </View>
          </View>
        )}

        {isProvider && pendingEarnings > 0 && (
          <View className="flex-row items-center gap-1.5 mt-2">
            <View className="bg-yellow-400/20 rounded-full px-2.5 py-0.5">
              <Text className="text-xs text-yellow-300 font-semibold">
                R{pendingEarnings.toFixed(2)} pending
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row border-t border-white/10">
        <Pressable
          onPress={onTopUp}
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 active:bg-white/5"
        >
          <ArrowDownLeft size={16} color={Colors.accent} />
          <Text className="text-sm font-semibold text-[#3ECF8E]">Top Up</Text>
        </Pressable>

        {onWithdraw && (
          <>
            <View className="w-px bg-white/10" />
            <Pressable
              onPress={onWithdraw}
              className="flex-1 flex-row items-center justify-center gap-2 py-3.5 active:bg-white/5"
            >
              <ArrowUpRight size={16} color="rgba(255,255,255,0.7)" />
              <Text className="text-sm font-semibold text-white/70">Withdraw</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
