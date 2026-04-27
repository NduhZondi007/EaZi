import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthStackScreenProps } from '@/types/navigation.types';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type FormData = z.infer<typeof schema>;

type Props = AuthStackScreenProps<'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.sendPasswordResetEmail(data.email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsSent(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full bg-[#F0FDF4] items-center justify-center mb-6">
            <Mail size={32} color="#16A34A" />
          </View>
          <Text className="text-2xl font-bold text-[#111111] text-center mb-3">
            Check your email
          </Text>
          <Text className="text-base text-[#6B7280] text-center mb-2">
            We sent a password reset link to:
          </Text>
          <Text className="text-base font-semibold text-[#111111] text-center mb-8">
            {getValues('email')}
          </Text>
          <Text className="text-sm text-[#9CA3AF] text-center mb-10">
            Didn't receive it? Check your spam folder or tap below to resend.
          </Text>

          <View className="w-full gap-3">
            <Button
              label="Resend Email"
              variant="secondary"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
            <Button
              label="Back to Login"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View className="flex-row items-center px-4 pt-2 pb-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#111111" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6">
          <View className="mb-10">
            <Text className="text-3xl font-bold text-[#111111]">Reset password</Text>
            <Text className="text-base text-[#6B7280] mt-2">
              Enter your email and we'll send you a link to reset your password.
            </Text>
          </View>

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

          {error ? (
            <View className="mt-4 p-3 bg-red-50 rounded-lg">
              <Text className="text-sm text-[#DC2626]">{error}</Text>
            </View>
          ) : null}

          <View className="mt-8">
            <Button
              label="Send Reset Link"
              isLoading={isLoading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
