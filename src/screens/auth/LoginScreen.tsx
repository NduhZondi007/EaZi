import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthStackScreenProps } from '@/types/navigation.types';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

type Props = AuthStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [authError, setAuthError] = useState<string | null>(null);
  const { setSession, setUser, setProfile, setLoading, isLoading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setAuthError(null);
    setLoading(true);
    try {
      const result = await authService.signIn(data);
      if (result.error) {
        setAuthError(result.error);
        return;
      }
      setSession(result.session);
      setUser(result.user);
      setProfile(result.profile);
    } catch {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-10">
            <Text className="text-3xl font-bold text-[#111111]">Welcome back</Text>
            <Text className="text-base text-[#6B7280] mt-2">
              Sign in to your EaZi account
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  isSecure
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              className="self-end"
              accessibilityRole="button"
            >
              <Text className="text-sm text-[#111111] font-medium">Forgot password?</Text>
            </Pressable>
          </View>

          {authError ? (
            <View className="mt-4 p-3 bg-red-50 rounded-lg">
              <Text className="text-sm text-[#DC2626]">{authError}</Text>
            </View>
          ) : null}

          <View className="mt-8 gap-4">
            <Button
              label="Log In"
              isLoading={isLoading}
              onPress={handleSubmit(onSubmit)}
            />

            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-[#E5E7EB]" />
              <Text className="text-xs text-[#9CA3AF]">or</Text>
              <View className="flex-1 h-px bg-[#E5E7EB]" />
            </View>

            <Pressable
              onPress={() => navigation.navigate('SignUp')}
              className="h-12 items-center justify-center"
              accessibilityRole="button"
            >
              <Text className="text-sm text-[#6B7280]">
                Don&apos;t have an account?{' '}
                <Text className="text-[#111111] font-semibold">Sign up</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
