import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, HelpCircle, Plus } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import { queryRepository, type QueryRow } from '@/repositories/query.repository';
import type { ProfileStackParamList } from '@/types/navigation.types';
import type { QueryCategory } from '@/types/database.types';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

const STATUS_BADGE: Record<QueryRow['status'], 'default' | 'info' | 'success' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
};

const CATEGORIES: { label: string; value: QueryCategory }[] = [
  { label: 'Booking', value: 'booking' },
  { label: 'Payment', value: 'payment' },
  { label: 'Account', value: 'account' },
  { label: 'Provider', value: 'provider' },
  { label: 'Technical', value: 'technical' },
  { label: 'Other', value: 'other' },
];

const newQuerySchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please describe your issue in more detail').max(2000),
  category: z.enum(['booking', 'payment', 'account', 'provider', 'technical', 'other']),
});

type NewQueryFormValues = z.infer<typeof newQuerySchema>;

export function SupportScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useAuthStore(selectProfile);
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NewQueryFormValues>({
    resolver: zodResolver(newQuerySchema),
    defaultValues: { subject: '', description: '', category: 'other' },
  });

  const selectedCategory = watch('category');

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await queryRepository.findByUser(profile.id);
      setQueries(data);
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    load();
  };

  const handleSubmitQuery = async (values: NewQueryFormValues) => {
    if (!profile) return;
    setIsSubmitting(true);
    try {
      const created = await queryRepository.create(profile.id, values);
      setQueries((prev) => [created, ...prev]);
      setIsModalOpen(false);
      resetForm();
      Alert.alert('Query submitted', 'Our support team will get back to you shortly.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit query.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F9FAFB] items-center justify-center">
        <ActivityIndicator color="#111111" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-[#E5E7EB]">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3"
        >
          <ChevronLeft size={24} color="#111111" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-[#111111]">Help & Support</Text>
        <Pressable
          onPress={() => setIsModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="New support query"
          className="w-9 h-9 bg-[#111111] rounded-full items-center justify-center"
        >
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={queries}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <EmptyState
            icon={<HelpCircle size={40} color="#9CA3AF" />}
            title="No support queries"
            message="Tap the + button to submit a new support query."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('SupportDetail', { queryId: item.id })}
            accessibilityRole="button"
            className="bg-white border border-[#E5E7EB] rounded-xl p-4"
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <View className="flex-row items-start justify-between mb-2">
              <Text
                className="flex-1 text-sm font-semibold text-[#111111] mr-2"
                numberOfLines={2}
              >
                {item.subject}
              </Text>
              <Badge label={item.status.replace('_', ' ')} variant={STATUS_BADGE[item.status]} />
            </View>
            <Text className="text-xs text-[#6B7280] capitalize">{item.category}</Text>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-xs text-[#9CA3AF]">
                {format(new Date(item.created_at), 'dd MMM yyyy')}
              </Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </Pressable>
        )}
      />

      <Modal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Support Query"
        scrollable
      >
        <View className="gap-4">
          <Controller
            control={control}
            name="subject"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Subject"
                value={value}
                onChangeText={onChange}
                placeholder="Brief description of your issue"
                error={errors.subject?.message}
              />
            )}
          />

          <View>
            <Text className="text-sm font-medium text-[#111111] mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setValue('category', cat.value)}
                  accessibilityRole="radio"
                  className={`px-3 py-1.5 rounded-full border ${
                    selectedCategory === cat.value
                      ? 'bg-[#111111] border-[#111111]'
                      : 'bg-white border-[#D1D5DB]'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selectedCategory === cat.value ? 'text-white' : 'text-[#374151]'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Description"
                value={value}
                onChangeText={onChange}
                placeholder="Describe your issue in detail…"
                error={errors.description?.message}
                multiline
                numberOfLines={5}
              />
            )}
          />

          <Pressable
            onPress={handleSubmit(handleSubmitQuery)}
            disabled={isSubmitting}
            className="h-12 bg-[#111111] rounded-xl items-center justify-center"
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed || isSubmitting ? 0.7 : 1 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-semibold text-white">Submit Query</Text>
            )}
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
