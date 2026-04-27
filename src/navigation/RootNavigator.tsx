import { useAuthStore, selectIsAuthenticated, selectProfile } from '@/stores/auth.store';
import { AuthStack } from './AuthStack';
import { ClientTabNavigator } from './ClientTabNavigator';
import { ProviderTabNavigator } from './ProviderTabNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';

export function RootNavigator() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const profile = useAuthStore(selectProfile);

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (profile?.role === 'provider') {
    return <ProviderTabNavigator />;
  }

  if (profile?.role === 'admin') {
    return <AdminTabNavigator />;
  }

  return <ClientTabNavigator />;
}
