import React, { useEffect, useState } from 'react';
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
  AtSign,
  Camera,
  ChevronDown,
  ChevronLeft,
  Globe,
  ImagePlus,
  Share2,
  X,
} from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { SERVICE_CATEGORIES } from '@/constants/services';
import {
  useProviderStore,
  selectMyServices,
  selectIsActionLoading,
} from '@/stores/provider.store';
import type { OperatingHours, DayHours, SocialLinks } from '@/types/service.types';
import type { ProviderServicesStackScreenProps } from '@/types/navigation.types';

type Props = ProviderServicesStackScreenProps<'EditService'>;

const DAYS: { key: keyof OperatingHours; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

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

export function EditServiceScreen({ route, navigation }: Props) {
  const { serviceId } = route.params;
  const myServices = useProviderStore(selectMyServices);
  const isActionLoading = useProviderStore(selectIsActionLoading);
  const { updateService } = useProviderStore();

  const service = myServices.find((s) => s.id === serviceId);

  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    (service?.operating_hours as OperatingHours) ?? {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '17:00', closed: true },
      sunday: { open: '08:00', close: '17:00', closed: true },
    },
  );
  const [existingUrls, setExistingUrls] = useState<string[]>(service?.gallery ?? []);
  const [newUris, setNewUris] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const socialLinks = service?.social_links as SocialLinks | undefined;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: service?.business_name ?? '',
      title: service?.title ?? '',
      serviceType: service?.service_type ?? '',
      description: service?.description ?? '',
      basePrice: service?.base_price?.toString() ?? '',
      twitter: socialLinks?.twitter ?? '',
      facebook: socialLinks?.facebook ?? '',
      instagram: socialLinks?.instagram ?? '',
      website: socialLinks?.website ?? '',
    },
  });

  const selectedType = watch('serviceType');

  useEffect(() => {
    if (!service) {
      Alert.alert('Error', 'Service not found.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [service, navigation]);

  const handlePickImages = async () => {
    const totalImages = existingUrls.length + newUris.length;
    if (totalImages >= 5) {
      Alert.alert('Limit reached', 'You can have a maximum of 5 photos.');
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
      selectionLimit: 5 - totalImages,
    });

    if (!result.canceled) {
      const picked = result.assets.map((a) => a.uri);
      setNewUris((prev) => [...prev, ...picked].slice(0, 5 - existingUrls.length));
    }
  };

  const removeExisting = (url: string) => setExistingUrls((prev) => prev.filter((u) => u !== url));
  const removeNew = (uri: string) => setNewUris((prev) => prev.filter((u) => u !== uri));

  const updateDay = (key: keyof OperatingHours, field: keyof DayHours, value: string | boolean) => {
    setOperatingHours((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { open: '08:00', close: '17:00', closed: false }), [field]: value },
    }));
  };

  const onSubmit = handleSubmit(async (data: FormData) => {
    if (!service) return;
    try {
      await updateService(
        serviceId,
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
        newUris,
        existingUrls,
      );
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update service. Please try again.');
    }
  });

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const allImages = [...existingUrls, ...newUris];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-gray-900 text-center mr-6">
          Edit Service
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-5 pb-10 gap-5">
        <SectionTitle title="Basic Information" />

        <Controller
          control={control}
          name="businessName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Business Name"
              value={value}
              onChangeText={onChange}
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
              maxLength={150}
              error={errors.title?.message}
            />
          )}
        />

        {/* Service Type */}
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
                  <Text className={`text-sm ${selectedType === cat ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
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
              <View key={key} className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 gap-3">
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
                    />
                    <Text className="text-xs text-gray-400">–</Text>
                    <TextInput
                      value={day.close}
                      onChangeText={(v) => updateDay(key, 'close', v)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 text-center bg-white"
                      maxLength={5}
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
          {existingUrls.map((url) => (
            <View key={url} className="relative">
              <Image
                source={{ uri: url }}
                style={{ width: 90, height: 90, borderRadius: 10 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removeExisting(url)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Remove image"
              >
                <X size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {newUris.map((uri) => (
            <View key={uri} className="relative">
              <Image
                source={{ uri }}
                style={{ width: 90, height: 90, borderRadius: 10 }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removeNew(uri)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Remove image"
              >
                <X size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {allImages.length < 5 && (
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
              icon={<AtSign size={16} color={Colors.gray400} />}
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
              icon={<Share2 size={16} color={Colors.gray400} />}
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
              icon={<Camera size={16} color={Colors.gray400} />}
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
          label={isActionLoading ? 'Saving...' : 'Save Changes'}
          onPress={onSubmit}
          isLoading={isActionLoading}
          disabled={isActionLoading}
        />
        </View>
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
