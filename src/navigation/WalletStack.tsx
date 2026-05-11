import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { WalletStackParamList } from '@/types/navigation.types';
import { WalletScreen } from '@/screens/wallet/WalletScreen';
import { TransactionHistoryScreen } from '@/screens/wallet/TransactionHistoryScreen';
import { TopUpScreen } from '@/screens/wallet/TopUpScreen';
import { SavedCardsScreen } from '@/screens/wallet/SavedCardsScreen';
import { WithdrawalScreen } from '@/screens/wallet/WithdrawalScreen';
import { WebViewScreen } from '@/screens/shared/WebViewScreen';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletMain" component={WalletScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="TopUp" component={TopUpScreen} />
      <Stack.Screen name="SavedCards" component={SavedCardsScreen} />
      <Stack.Screen name="Withdrawal" component={WithdrawalScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
