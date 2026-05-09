import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProviderBookingsStackParamList } from '@/types/navigation.types';
import { ProviderBookingsScreen } from '@/screens/provider/ProviderBookingsScreen';
import { ProviderBookingDetailScreen } from '@/screens/provider/ProviderBookingDetailScreen';

const Stack = createNativeStackNavigator<ProviderBookingsStackParamList>();

export function ProviderBookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProviderBookingsList" component={ProviderBookingsScreen} />
      <Stack.Screen name="ProviderBookingDetail" component={ProviderBookingDetailScreen} />
    </Stack.Navigator>
  );
}
