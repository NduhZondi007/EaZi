import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/types/navigation.types';
import { HomeScreen } from '@/screens/client/HomeScreen';
import { ServiceDetailScreen } from '@/screens/client/ServiceDetailScreen';
import { ProviderProfileScreen } from '@/screens/client/ProviderProfileScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
    </Stack.Navigator>
  );
}
