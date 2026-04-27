import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRow } from '@/types/database.types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserRow | null;
  isLoading: boolean;
  isInitialized: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserRow | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
    }),
}));

export const selectSession = (s: AuthState) => s.session;
export const selectUser = (s: AuthState) => s.user;
export const selectProfile = (s: AuthState) => s.profile;
export const selectIsLoading = (s: AuthState) => s.isLoading;
export const selectIsInitialized = (s: AuthState) => s.isInitialized;
export const selectIsAuthenticated = (s: AuthState) => s.session !== null;
