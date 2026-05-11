import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronLeft, ShoppingBag, Wrench } from 'lucide-react-native';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthStackScreenProps } from '@/types/navigation.types';
import type { UserRole } from '@/types/database.types';

const SERVICE_TYPES = [
  'Cleaning', 'Plumbing', 'Electrical', 'Gardening', 'Painting',
  'Carpentry', 'Tutoring', 'Photography', 'Security', 'Catering', 'Other',
];

const step2Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .regex(/^[0-9+\s-]+$/, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const step3Schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  serviceType: z.string().min(1, 'Select a service type'),
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(500),
  address: z.string().min(5, 'Address is required'),
});

type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

type Props = AuthStackScreenProps<'SignUp'>;

const TOTAL_STEPS_CLIENT = 3;
const TOTAL_STEPS_PROVIDER = 4;

export function SignUpScreen({ navigation }: Props) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState('');
  const { setSession, setUser, setProfile, setLoading, isLoading } = useAuthStore();

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { businessName: '', serviceType: '', bio: '', address: '' },
  });

  const totalSteps = role === 'provider' ? TOTAL_STEPS_PROVIDER : TOTAL_STEPS_CLIENT;

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const handleStep1 = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleStep2 = step2Form.handleSubmit(() => {
    setStep(role === 'provider' ? 3 : 4);
  });

  const handleStep3 = step3Form.handleSubmit((data) => {
    step3Form.setValue('serviceType', serviceType);
    if (!serviceType) {
      step3Form.setError('serviceType', { message: 'Select a service type' });
      return;
    }
    setStep(4);
  });

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setAuthError('Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!role) return;

    setAuthError(null);
    setLoading(true);

    const step2 = step2Form.getValues();
    const step3 = step3Form.getValues();

    try {
      const result = await authService.signUp({
        email: step2.email,
        password: step2.password,
        name: step2.name,
        phone: step2.phone,
        role,
        ...(role === 'provider' && {
          businessName: step3.businessName,
          serviceType: serviceType,
          bio: step3.bio,
          address: step3.address,
        }),
      });

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

  const renderProgress = () => (
    <View className="flex-row gap-1.5 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          className={`h-1 flex-1 rounded-full ${i < step ? 'bg-[#111111]' : 'bg-[#E5E7EB]'}`}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="flex-1">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-[#111111] text-center mb-2">
          I want to…
        </Text>
        <Text className="text-base text-[#6B7280] text-center">
          Choose how you'll use EaZi
        </Text>
      </View>

      <View className="gap-4">
        <Pressable
          onPress={() => handleStep1('client')}
          className="p-6 rounded-xl border-2 border-[#E5E7EB] bg-white"
          accessibilityRole="button"
        >
          <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mb-3">
            <ShoppingBag size={20} color="#2563EB" />
          </View>
          <Text className="text-lg font-semibold text-[#111111]">Find a service</Text>
          <Text className="text-sm text-[#6B7280] mt-1">
            Book verified service providers near me
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleStep1('provider')}
          className="p-6 rounded-xl border-2 border-[#E5E7EB] bg-white"
          accessibilityRole="button"
        >
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mb-3">
            <Wrench size={20} color="#374151" />
          </View>
          <Text className="text-lg font-semibold text-[#111111]">Offer services</Text>
          <Text className="text-sm text-[#6B7280] mt-1">
            Grow my business and earn more customers
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="flex-1">
      <Text className="text-3xl font-bold text-[#111111] mb-2">Account details</Text>
      <Text className="text-base text-[#6B7280] mb-8">Create your EaZi account</Text>

      <View className="gap-4">
        <Controller
          control={step2Form.control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full name"
              placeholder="Your full name"
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={step2Form.formState.errors.name?.message}
            />
          )}
        />

        <Controller
          control={step2Form.control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={step2Form.formState.errors.email?.message}
            />
          )}
        />

        <Controller
          control={step2Form.control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone number"
              placeholder="+27 61 234 5678"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={step2Form.formState.errors.phone?.message}
            />
          )}
        />

        <Controller
          control={step2Form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="At least 8 characters"
              isSecure
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={step2Form.formState.errors.password?.message}
            />
          )}
        />

        <Controller
          control={step2Form.control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm password"
              placeholder="Repeat your password"
              isSecure
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={step2Form.formState.errors.confirmPassword?.message}
            />
          )}
        />
      </View>

      <View className="mt-8">
        <Button label="Continue" onPress={handleStep2} />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="flex-1">
      <Text className="text-3xl font-bold text-[#111111] mb-2">Business details</Text>
      <Text className="text-base text-[#6B7280] mb-8">
        Tell clients about your business
      </Text>

      <View className="gap-4">
        <Controller
          control={step3Form.control}
          name="businessName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Business name"
              placeholder="e.g. Ndumiso's Plumbing"
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={step3Form.formState.errors.businessName?.message}
            />
          )}
        />

        <View>
          <Text className="text-sm font-medium text-[#374151] mb-1.5">Service type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          >
            {SERVICE_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setServiceType(type);
                  step3Form.setValue('serviceType', type);
                }}
                className={`px-4 py-2 rounded-full border ${
                  serviceType === type
                    ? 'bg-[#111111] border-[#111111]'
                    : 'bg-white border-[#D1D5DB]'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    serviceType === type ? 'text-white' : 'text-[#374151]'
                  }`}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {step3Form.formState.errors.serviceType ? (
            <Text className="text-xs text-[#DC2626] mt-1">
              {step3Form.formState.errors.serviceType.message}
            </Text>
          ) : null}
        </View>

        <Controller
          control={step3Form.control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Text className="text-sm font-medium text-[#374151] mb-1.5">Bio</Text>
              <View
                className={`bg-white rounded-lg border p-3 ${
                  step3Form.formState.errors.bio
                    ? 'border-2 border-[#DC2626]'
                    : 'border-[#D1D5DB]'
                }`}
              >
                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="Describe your experience and services..."
                  placeholderTextColor="#9CA3AF"
                  className="text-sm text-[#111111] min-h-[96px]"
                  textAlignVertical="top"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  maxLength={500}
                />
              </View>
              {step3Form.formState.errors.bio ? (
                <Text className="text-xs text-[#DC2626] mt-1">
                  {step3Form.formState.errors.bio.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={step3Form.control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Business address"
              placeholder="Street, City, Province"
              autoCapitalize="words"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={step3Form.formState.errors.address?.message}
            />
          )}
        />
      </View>

      <View className="mt-8">
        <Button label="Continue" onPress={handleStep3} />
      </View>
    </View>
  );

  const renderTermsStep = () => (
    <View className="flex-1">
      <Text className="text-3xl font-bold text-[#111111] mb-2">Almost done!</Text>
      <Text className="text-base text-[#6B7280] mb-8">
        Review and accept our terms to create your account
      </Text>

      <View className="flex-1 p-4 bg-[#F9FAFB] rounded-xl mb-6">
        <Text className="text-sm font-semibold text-[#111111] mb-2">
          Terms & Conditions
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-sm text-[#6B7280] leading-5">
            By creating an EaZi account, you agree to our Terms of Service and Privacy
            Policy. You confirm that the information you have provided is accurate and
            complete. EaZi reserves the right to verify your identity and suspend accounts
            that violate our community guidelines. Providers must maintain a minimum rating
            of 3.0 to remain active on the platform. All transactions are subject to a
            platform service fee. For full terms, visit eazi.co.za/terms.
          </Text>
        </ScrollView>
      </View>

      <Pressable
        onPress={() => setTermsAccepted((v) => !v)}
        className="flex-row items-center gap-3 mb-6"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: termsAccepted }}
      >
        <View
          className={`w-6 h-6 rounded items-center justify-center border-2 ${
            termsAccepted ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#D1D5DB]'
          }`}
        >
          {termsAccepted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <Text className="flex-1 text-sm text-[#374151]">
          I accept the Terms & Conditions and Privacy Policy
        </Text>
      </Pressable>

      {authError ? (
        <View className="mb-4 p-3 bg-red-50 rounded-lg">
          <Text className="text-sm text-[#DC2626]">{authError}</Text>
        </View>
      ) : null}

      <Button
        label="Create Account"
        isLoading={isLoading}
        onPress={handleSubmit}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View className="flex-row items-center px-4 pt-2 pb-4">
        <Pressable
          onPress={goBack}
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step > 1 && renderProgress()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && role === 'provider' && renderStep3()}
          {step === 4 && renderTermsStep()}
          {step === 3 && role === 'client' && renderTermsStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

