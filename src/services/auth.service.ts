import { supabase } from '@/lib/supabase';
import { userRepository } from '@/repositories/user.repository';
import type { UserRow, UserRole } from '@/types/database.types';
import type { Session, User, AuthError } from '@supabase/supabase-js';

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  businessName?: string;
  serviceType?: string;
  bio?: string;
  address?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
  profile: UserRow | null;
  error: string | null;
}

class AuthService {
  async signIn(payload: SignInPayload): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      return { user: null, session: null, profile: null, error: this.parseError(error) };
    }

    const profile = data.user ? await userRepository.findById(data.user.id) : null;

    return {
      user: data.user,
      session: data.session,
      profile,
      error: null,
    };
  }

  async signUp(payload: SignUpPayload): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
          role: payload.role,
          phone: payload.phone,
          business_name: payload.businessName,
          service_type: payload.serviceType,
          bio: payload.bio,
          address: payload.address,
        },
      },
    });

    if (error) {
      return { user: null, session: null, profile: null, error: this.parseError(error) };
    }

    const profile = data.user ? await userRepository.findById(data.user.id) : null;

    return {
      user: data.user,
      session: data.session,
      profile,
      error: null,
    };
  }

  async signOut(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error ? this.parseError(error) : null };
  }

  async sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'eazi://reset-password',
    });
    return { error: error ? this.parseError(error) : null };
  }

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? this.parseError(error) : null };
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  }

  async refreshSession(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.refreshSession();
    return { error: error ? this.parseError(error) : null };
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return listener.subscription;
  }

  private parseError(error: AuthError): string {
    const map: Record<string, string> = {
      'Invalid login credentials': 'Incorrect email or password. Please try again.',
      'Email not confirmed': 'Please verify your email before signing in.',
      'User already registered': 'An account with this email already exists.',
      'Password should be at least 6 characters': 'Password must be at least 8 characters.',
      'Network request failed': 'Network error. Please check your connection.',
    };

    for (const [key, message] of Object.entries(map)) {
      if (error.message.includes(key)) return message;
    }
    return error.message || 'Something went wrong. Please try again.';
  }
}

export const authService = new AuthService();
