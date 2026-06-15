import { useCallback } from 'react';
import {
  useAuthStore,
  selectProfile,
  selectIsAuthenticated,
  selectIsLoading,
  selectSession,
} from '@/stores/auth.store';
import { authService, type SignInPayload } from '@/services/auth.service';

export function useAuth() {
  const profile = useAuthStore(selectProfile);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const session = useAuthStore(selectSession);
  const { setLoading, reset } = useAuthStore();

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      setLoading(true);
      try {
        return await authService.signIn(payload);
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    reset();
  }, [reset]);

  const forgotPassword = useCallback(async (email: string) => {
    return authService.sendPasswordResetEmail(email);
  }, []);

  return {
    profile,
    session,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    forgotPassword,
  };
}
