import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { authService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import { useAuthStore, selectIsInitialized } from '@/stores/auth.store';
import { RootNavigator } from '@/navigation/RootNavigator';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { linking } from '@/navigation/linking';
import { navigationRef } from '@/lib/navigationRef';

export function AuthGate() {
  const { setSession, setUser, setProfile, setInitialized } = useAuthStore();
  const isInitialized = useAuthStore(selectIsInitialized);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const session = await authService.getSession();

      if (!mounted) return;

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        try {
          const profile = await userRepository.findById(session.user.id);
          if (mounted) setProfile(profile);
        } catch {
          if (mounted) setProfile(null);
        }
      }

      if (mounted) setInitialized(true);
    };

    initAuth();

    const subscription = authService.onAuthStateChange(async (session) => {
      if (!mounted) return;

      if (session?.user) {
        // Fetch profile before updating auth state so RootNavigator never sees
        // isAuthenticated=true with profile=null (prevents client UI flash for providers).
        let profile = null;
        try {
          profile = await userRepository.findById(session.user.id);
        } catch {
          // profile stays null; navigator falls through to client tab
        }
        if (!mounted) return;
        setSession(session);
        setUser(session.user);
        setProfile(profile);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      if (mounted) setInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}
