import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronDown,
  ChevronLeft,
  Facebook,
  Globe,
  ImagePlus,
  Instagram,
  Twitter,
  X,
} from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { useProviderStore, selectIsActionLoading } from '@/stores/provider.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { OperatingHours, DayHours } from '@/types/service.types';
import type { ProviderServicesStackScreenProps } from '@/types/navigation.types';

type Props = ProviderServicesStackScreenProps<'CreateService'>;

const DAYS: { key: keyof OperatingHours; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const DEFAULT_HOURS: OperatingHours = {
  monday: { open: '08:00', close: '17:00', closed: false },
  tuesday: { open: '08:00', close: '17:00', closed: false },
  wednesday: { open: '08:00', close: '17:00', closed: false },
  thursday: { open: '08:00', close: '17:00', closed: false },
  friday: { open: '08:00', close: '17:00', closed: false },
  saturday: { open: '08:00', close: '17:00', closed: true },
  sunday: { open: '08:00', close: '17:00', closed: true },
};

const schema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  title: z.string().min(1, 'Title is required').max(150),
  serviceType: z.string().min(1, 'Service type is required'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000),
  basePrice: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 50, 'Minimum price is R50'),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateServiceScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const isActionLoading = useProviderStore(selectIsActionLoading);
  const { createService } = useProviderStore();

  const [operatingHours, setOperatingHours] = useState<OperatingHours>(DEFAULT_HOURS);
  const [galleryUris, setGalleryUris] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: '',
      title: '',
      serviceType: '',
      description: '',
      basePrice: '',
      twitter: '',
      facebook: '',
      instagram: '',
      website: '',
    },
  });

  const selectedType = watch('serviceType');

  const handlePickImages = async () => {
    if (galleryUris.length >= 5) {
      Alert.alert('Limit reached', 'You can upload a maximum of 5 photos.');
      return;
    }

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - galleryUris.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setGalleryUris((prev) => [...prev, ...newUris].slice(0, 5));
    }
  };

  const removeImage = (uri: string) => {
    setGalleryUris((prev) => prev.filter((u) => u !== uri));
  };

  const updateDay = (key: keyof OperatingHours, field: keyof DayHours, value: string | boolean) => {
    setOperatingHours((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { open: '08:00', close: '17:00', closed: false }), [field]: value },
    }));
  };

  const onSubmit = handleSubmit(async (data: FormData) => {
    if (!profile?.id) return;

    try {
      await createService(
        profile.id,
        {
          business_name: data.businessName,
          title: data.title,
          description: data.description,
          service_type: data.serviceType,
          base_price: Number(data.basePrice),
          operating_hours: operatingHours,
          social_links: {
            ...(data.twitter ? { twitter: data.twitter } : {}),
            ...(data.facebook ? { facebook: data.facebook } : {}),
            ...(data.instagram ? { instagram: data.instagram } : {}),
            ...(data.website ? { website: data.website } : {}),
          },
        },
        galleryUris,
      );
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to create service. Please try again.');
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900 text-center mr-6">
          Create Service
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pt-5 pb-10 gap-5"
      >
        {/* Basic Info */}
        <SectionTitle title="Basic Information" />

        <Controller
          control={control}
          name="businessName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Business Name"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Sparks Electrical Services"
              maxLength={100}
              error={errors.businessName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Service Title"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. Home Electrical Repairs & Installations"
              maxLength={150}
              error={errors.title?.message}
            />
          )}
        />

        {/* Service Type Picker */}
        <View>
          <Text className="text-sm font-medium text-[#374151] mb-1.5">Service Type</Text>
          <Pressable
            onPress={() => setShowCategoryPicker((v) => !v)}
            className="flex-row items-center justify-between bg-white border border-[#D1D5DB] rounded-lg px-3 h-12"
            accessibilityRole="button"
            accessibilityLabel="Select service type"
          >
            <Text className={selectedType ? 'text-sm text-[#111111]' : 'text-sm text-[#9CA3AF]'}>
              {selectedType || 'Select a category'}
            </Text>
            <ChevronDown size={16} color={Colors.gray400} />
          </Pressable>
          {errors.serviceType?.message ? (
            <Text className="text-xs text-[#DC2626] mt-1">{errors.serviceType.message}</Text>
          ) : null}
          {showCategoryPicker && (
            <View className="mt-1 border border-gray-200 rounded-lg bg-white overflow-hidden">
              {SERVICE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setValue('serviceType', cat, { shouldValidate: true });
                    setShowCategoryPicker(false);
                  }}
                  className={`px-4 py-3 border-b border-gray-50 ${selectedType === cat ? 'bg-gray-50' : ''}`}
                  accessibilityRole="menuitem"
                >
                  <Text
                    className={`text-sm ${selectedType === cat ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text className="text-sm font-medium text-[#374151] mb-1.5">Description</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Describe your service in detail (min 20 characters)..."
                multiline
                numberOfLines={5}
                maxLength={1000}
                placeholderTextColor="#9CA3AF"
                className={`bg-white border rounded-lg px-3 py-3 text-sm text-[#111111] min-h-[120px] ${
                  errors.description ? 'border-2 border-[#DC2626]' : 'border border-[#D1D5DB]'
                }`}
                style={{ textAlignVertical: 'top' }}
              />
              {errors.description?.message ? (
                <Text className="text-xs text-[#DC2626] mt-1">{errors.description.message}</Text>
              ) : null}
              <Text className="text-xs text-gray-400 mt-1 text-right">
                {value.length}/1000
              </Text>
            </View>
          )}
        />

        <Controller
          control={control}
          name="basePrice"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Base Price (ZAR)"
              value={value}
              onChangeText={onChange}
              placeholder="e.g. 350"
              keyboardType="numeric"
              error={errors.basePrice?.message}
            />
          )}
        />

        {/* Operating Hours */}
        <SectionTitle title="Operating Hours" />
        <View className="gap-2">
          {DAYS.map(({ key, label }) => {
            const day = operatingHours[key] ?? { open: '08:00', close: '17:00', closed: false };
            return (
              <View
                key={key}
                className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 gap-3"
              >
                <Text className="text-sm font-medium text-gray-700 w-8">{label}</Text>
                <Switch
                  value={!day.closed}
                  onValueChange={(v) => updateDay(key, 'closed', !v)}
                  trackColor={{ false: Colors.gray300, true: Colors.accent }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={`Toggle ${label}`}
                />
                {!day.closed ? (
                  <View className="flex-1 flex-row items-center gap-2">
                    <TextInput
                      value={day.open}
                      onChangeText={(v) => updateDay(key, 'open', v)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center bg-white"
                      maxLength={5}
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text className="text-xs text-gray-400">–</Text>
                    <TextInput
                      value={day.close}
                      onChangeText={(v) => updateDay(key, 'close', v)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center bg-white"
                      maxLength={5}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                ) : (
                  <Text className="flex-1 text-sm text-gray-400 italic">Closed</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Gallery */}
        <SectionTitle title="Photos (up to 5)" />
        <View className="flex-row flex-wrap gap-2">
          {galleryUris.map((uri) => (
            <View key={uri} className="relative">
              <Image
                source={{ uri }}
                style={{ width: 90, height: 90, borderRadius: 10 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removeImage(uri)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Remove image"
              >
                <X size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {galleryUris.length < 5 && (
            <Pressable
              onPress={handlePickImages}
              className="w-[90px] h-[90px] rounded-[10px] bg-gray-100 border border-dashed border-gray-300 items-center justify-center gap-1"
              accessibilityRole="button"
              accessibilityLabel="Add photos"
            >
              <ImagePlus size={22} color={Colors.gray400} />
              <Text className="text-xs text-gray-400">Add</Text>
            </Pressable>
          )}
        </View>

        {/* Social Links */}
        <SectionTitle title="Social Links (optional)" />

        <Controller
          control={control}
          name="twitter"
          render={({ field: { onChange, value } }) => (
            <SocialInput
              icon={<Twitter size={16} color={Colors.gray400} />}
              placeholder="twitter.com/yourhandle"
              value={value ?? ''}
              onChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="facebook"
          render={({ field: { onChange, value } }) => (
            <SocialInput
              icon={<Facebook size={16} color={Colors.gray400} />}
              placeholder="facebook.com/yourpage"
              value={value ?? ''}
              onChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="instagram"
          render={({ field: { onChange, value } }) => (
            <SocialInput
              icon={<Instagram size={16} color={Colors.gray400} />}
              placeholder="instagram.com/yourprofile"
              value={value ?? ''}
              onChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="website"
          render={({ field: { onChange, value } }) => (
            <SocialInput
              icon={<Globe size={16} color={Colors.gray400} />}
              placeholder="yourwebsite.co.za"
              value={value ?? ''}
              onChange={onChange}
            />
          )}
        />

        <Button
          label={isActionLoading ? 'Creating...' : 'Create Service'}
          onPress={onSubmit}
          isLoading={isActionLoading}
          disabled={isActionLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
      {title}
    </Text>
  );
}

function SocialInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row items-center bg-white border border-[#D1D5DB] rounded-lg px-3 h-11 gap-2">
      {icon}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 text-sm text-[#111111]"
      />
    </View>
  );
}
