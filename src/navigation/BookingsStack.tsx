import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from '@/types/navigation.types';
import { BookingsListScreen } from '@/screens/client/BookingsListScreen';
import { BookingDetailScreen } from '@/screens/client/BookingDetailScreen';
import { WebViewScreen } from '@/screens/shared/WebViewScreen';

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsList" component={BookingsListScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
