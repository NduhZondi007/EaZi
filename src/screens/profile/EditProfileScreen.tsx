import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Save } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import { userRepository } from '@/repositories/user.repository';
import type { GenderType } from '@/types/database.types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const GENDER_OPTIONS: { label: string; value: GenderType }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

export function EditProfileScreen() {
  const navigation = useNavigation();
  const profile = useAuthStore(selectProfile);
  const { setProfile } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGender, setSelectedGender] = useState<GenderType | null>(profile?.gender ?? null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.name ?? '',
      phone: profile?.phone ?? '',
      bio: profile?.bio ?? '',
      address: profile?.address ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await userRepository.update(profile.id, {
        name: values.name,
        phone: values.phone || null,
        bio: values.bio || null,
        address: values.address || null,
        gender: selectedGender,
      });
      setProfile(updated);
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-4 border-b border-[#E5E7EB]">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3"
        >
          <ChevronLeft size={24} color="#111111" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-[#111111]">Edit Profile</Text>
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save changes"
          className="flex-row items-center gap-1"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#111111" />
          ) : (
            <Save size={20} color="#111111" />
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, gap: 16 }}
        >
          <View className="items-center mb-4">
            <Avatar uri={profile?.profile_image_url} name={profile?.name} size="xl" />
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                value={value}
                onChangeText={onChange}
                placeholder="Your full name"
                error={errors.name?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                placeholder="+27 XX XXX XXXX"
                error={errors.phone?.message}
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Bio"
                value={value}
                onChangeText={onChange}
                placeholder="Tell us about yourself…"
                error={errors.bio?.message}
                multiline
                numberOfLines={3}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Address"
                value={value}
                onChangeText={onChange}
                placeholder="Your address"
                error={errors.address?.message}
              />
            )}
          />

          <View>
            <Text className="text-sm font-medium text-[#111111] mb-2">Gender</Text>
            <View className="flex-row flex-wrap gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSelectedGender(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedGender === opt.value }}
                  className={`px-4 py-2 rounded-full border ${
                    selectedGender === opt.value
                      ? 'bg-[#111111] border-[#111111]'
                      : 'bg-white border-[#D1D5DB]'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedGender === opt.value ? 'text-white' : 'text-[#374151]'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="h-12 bg-[#111111] rounded-xl items-center justify-center mt-4"
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed || isSaving ? 0.7 : 1 }]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-semibold text-white">Save Changes</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
