import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import {
  useAuthStore,
  selectIsInitialized,
  selectIsAuthenticated,
} from '@/stores/auth.store';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import type { AuthStackParamList } from '@/types/navigation.types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AuthenticatedApp() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#111111" />
    </View>
  );
}

export function AuthGate() {
  const {
    setSession,
    setUser,
    setProfile,
    setInitialized,
  } = useAuthStore();

  const isInitialized = useAuthStore(selectIsInitialized);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

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

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const profile = await userRepository.findById(session.user.id);
          if (mounted) setProfile(profile);
        } catch {
          if (mounted) setProfile(null);
        }
      } else {
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
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111111" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedApp /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
