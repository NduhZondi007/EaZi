import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore, selectIsAuthenticated, selectProfile } from '@/stores/auth.store';
import { useNotifications } from '@/hooks/useNotifications';
import { AuthStack } from './AuthStack';
import { ClientTabNavigator } from './ClientTabNavigator';
import { ProviderTabNavigator } from './ProviderTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';
import { NotificationsScreen } from '@/screens/shared/NotificationsScreen';
import type { RootStackParamList } from '@/types/navigation.types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const profile = useAuthStore(selectProfile);

  useNotifications();

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  const initialRouteName: keyof Pick<RootStackParamList, 'ClientTabs' | 'ProviderTabs' | 'AdminTabs'> =
    profile?.role === 'provider'
      ? 'ProviderTabs'
      : profile?.role === 'admin'
        ? 'AdminTabs'
        : 'ClientTabs';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="ClientTabs" component={ClientTabNavigator} />
      <Stack.Screen name="ProviderTabs" component={ProviderTabNavigator} />
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
