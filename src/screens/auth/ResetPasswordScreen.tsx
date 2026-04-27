import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react-native';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthStackScreenProps } from '@/types/navigation.types';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

type Props = AuthStackScreenProps<'ResetPassword'>;

export function ResetPasswordScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.updatePassword(data.password);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsDone(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full bg-[#F0FDF4] items-center justify-center mb-6">
            <CheckCircle size={32} color="#16A34A" />
          </View>
          <Text className="text-2xl font-bold text-[#111111] text-center mb-3">
            Password updated!
          </Text>
          <Text className="text-base text-[#6B7280] text-center mb-10">
            Your password has been changed successfully. You can now log in with your new
            password.
          </Text>
          <Button
            label="Go to Login"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-16">
          <View className="mb-10">
            <Text className="text-3xl font-bold text-[#111111]">New password</Text>
            <Text className="text-base text-[#6B7280] mt-2">
              Enter and confirm your new password below.
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New password"
                  placeholder="At least 8 characters"
                  isSecure
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm new password"
                  placeholder="Repeat your password"
                  isSecure
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />
          </View>

          {error ? (
            <View className="mt-4 p-3 bg-red-50 rounded-lg">
              <Text className="text-sm text-[#DC2626]">{error}</Text>
            </View>
          ) : null}

          <View className="mt-8">
            <Button
              label="Update Password"
              isLoading={isLoading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
