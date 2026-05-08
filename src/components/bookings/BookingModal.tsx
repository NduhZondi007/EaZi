import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ChevronLeft, CreditCard, Shield, User, Users, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/colors';
import { useBookingStore } from '@/stores/booking.store';
import { useAuthStore } from '@/stores/auth.store';
import type { BookingFor } from '@/types/database.types';
import type { ServiceWithDetails } from '@/types/service.types';

let NativeDateTimePicker: React.ComponentType<{
  value: Date;
  mode: 'date' | 'time';
  minimumDate?: Date;
  display?: string;
  onChange: (event: unknown, date?: Date) => void;
}> | null = null;

if (Platform.OS !== 'web') {
  NativeDateTimePicker =
    require('@react-native-community/datetimepicker').default;
}

interface Props {
  visible: boolean;
  service: ServiceWithDetails;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

type Step = 1 | 2 | 3 | 4;

interface FormState {
  date: Date;
  time: Date;
  address: string;
  bookingFor: BookingFor;
  recipientName: string;
  recipientPhone: string;
}

const STEP_TITLES: Record<Step, string> = {
  1: 'Select Date & Time',
  2: 'Service Address',
  3: 'Booking For',
  4: 'Confirm Booking',
};

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-3">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <View
          key={s}
          style={{
            width: s === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: s <= current ? Colors.primary : Colors.gray200,
          }}
        />
      ))}
    </View>
  );
}

function DateRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="border border-gray-200 rounded-lg px-4 h-12 flex-row items-center justify-between"
    >
      <Text className="text-sm text-gray-400">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{value}</Text>
    </Pressable>
  );
}

export function BookingModal({ visible, service, onClose, onSuccess }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const createBooking = useBookingStore((s) => s.createBooking);
  const isCreating = useBookingStore((s) => s.isCreating);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    date: tomorrow,
    time: tomorrow,
    address: profile?.home_address ?? profile?.address ?? '',
    bookingFor: 'self',
    recipientName: '',
    recipientPhone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  const resetForm = useCallback(() => {
    setStep(1);
    setErrors({});
    setShowDatePicker(false);
    setShowTimePicker(false);
    setForm({
      date: tomorrow,
      time: tomorrow,
      address: profile?.home_address ?? profile?.address ?? '',
      bookingFor: 'self',
      recipientName: '',
      recipientPhone: '',
    });
  }, [profile, tomorrow]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const validateStep = (s: Step): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (s === 1) {
      const now = new Date();
      if (form.date < now) {
        newErrors.date = 'Please select a future date';
      }
    }

    if (s === 2) {
      if (!form.address.trim()) {
        newErrors.address = 'Please enter the service address';
      }
    }

    if (s === 3 && form.bookingFor === 'other') {
      if (!form.recipientName.trim()) {
        newErrors.recipientName = "Please enter the recipient's name";
      }
      if (!form.recipientPhone.trim()) {
        newErrors.recipientPhone = "Please enter the recipient's phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    setErrors({});
  };

  const handleConfirm = async () => {
    if (!profile) return;
    if (!validateStep(step)) return;

    const dateStr = format(form.date, 'yyyy-MM-dd');
    const timeStr = format(form.time, 'HH:mm:ss');

    try {
      const bookingId = await createBooking({
        client_id: profile.id,
        provider_id: service.provider.id,
        service_id: service.id,
        service_address: form.address,
        date: dateStr,
        time: timeStr,
        amount: service.base_price,
        booking_for: form.bookingFor,
        recipient_name:
          form.bookingFor === 'other' ? form.recipientName.trim() : null,
        recipient_phone:
          form.bookingFor === 'other' ? form.recipientPhone.trim() : null,
      });

      resetForm();
      onSuccess(bookingId);
    } catch (err) {
      Alert.alert(
        'Booking Failed',
        err instanceof Error ? err.message : 'Could not create booking',
      );
    }
  };

  const openNativeDatePicker = (mode: 'date' | 'time') => {
    setDatePickerMode(mode);
    if (mode === 'date') {
      setShowDatePicker(true);
      setShowTimePicker(false);
    } else {
      setShowTimePicker(true);
      setShowDatePicker(false);
    }
  };

  const renderStep1 = () => (
    <View className="gap-4">
      <Text className="text-sm text-gray-500 leading-5">
        Choose the date and time you'd like the service to be performed.
      </Text>

      {Platform.OS === 'web' ? (
        <View className="gap-3">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Date</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-4 h-12 text-sm text-gray-900"
              value={format(form.date, 'yyyy-MM-dd')}
              onChangeText={(text) => {
                const parsed = new Date(text);
                if (!isNaN(parsed.getTime())) {
                  setForm((f) => ({ ...f, date: parsed }));
                }
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray400}
            />
            {errors.date ? (
              <Text className="text-xs text-red-500 mt-1">{errors.date}</Text>
            ) : null}
          </View>
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Time</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-4 h-12 text-sm text-gray-900"
              value={format(form.time, 'HH:mm')}
              onChangeText={(text) => {
                const [h, m] = text.split(':').map(Number);
                if (!isNaN(h) && !isNaN(m)) {
                  const d = new Date(form.time);
                  d.setHours(h, m, 0, 0);
                  setForm((f) => ({ ...f, time: d }));
                }
              }}
              placeholder="HH:MM"
              placeholderTextColor={Colors.gray400}
            />
          </View>
        </View>
      ) : (
        <View className="gap-3">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Date</Text>
            <DateRow
              label="Tap to select"
              value={format(form.date, 'EEEE, MMMM d, yyyy')}
              onPress={() => openNativeDatePicker('date')}
            />
            {errors.date ? (
              <Text className="text-xs text-red-500 mt-1">{errors.date}</Text>
            ) : null}
            {showDatePicker && NativeDateTimePicker && datePickerMode === 'date' && (
              <NativeDateTimePicker
                value={form.date}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_: unknown, selectedDate?: Date) => {
                  if (Platform.OS !== 'ios') setShowDatePicker(false);
                  if (selectedDate) setForm((f) => ({ ...f, date: selectedDate }));
                }}
              />
            )}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Time</Text>
            <DateRow
              label="Tap to select"
              value={format(form.time, 'h:mm a')}
              onPress={() => openNativeDatePicker('time')}
            />
            {showTimePicker && NativeDateTimePicker && datePickerMode === 'time' && (
              <NativeDateTimePicker
                value={form.time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_: unknown, selectedDate?: Date) => {
                  if (Platform.OS !== 'ios') setShowTimePicker(false);
                  if (selectedDate) setForm((f) => ({ ...f, time: selectedDate }));
                }}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View className="gap-4">
      <Text className="text-sm text-gray-500 leading-5">
        Where should the provider come? Enter the full address.
      </Text>
      <Input
        label="Service Address"
        value={form.address}
        onChangeText={(text) => setForm((f) => ({ ...f, address: text }))}
        placeholder="e.g. 12 Main Street, Sandton, Johannesburg"
        error={errors.address}
        multiline
        numberOfLines={2}
        style={{ height: 72, textAlignVertical: 'top', paddingTop: 12 }}
      />
    </View>
  );

  const renderStep3 = () => (
    <View className="gap-4">
      <Text className="text-sm text-gray-500 leading-5">
        Who is this booking for?
      </Text>

      <View className="flex-row gap-3">
        {(['self', 'other'] as BookingFor[]).map((opt) => (
          <Pressable
            key={opt}
            onPress={() => setForm((f) => ({ ...f, bookingFor: opt }))}
            className={[
              'flex-1 border-2 rounded-xl py-4 items-center',
              form.bookingFor === opt ? 'border-gray-900 bg-gray-50' : 'border-gray-200',
            ].join(' ')}
          >
            <View className="mb-2">
              {opt === 'self'
                ? <User size={24} color={form.bookingFor === opt ? Colors.primary : Colors.gray400} />
                : <Users size={24} color={form.bookingFor === opt ? Colors.primary : Colors.gray400} />}
            </View>
            <Text
              className={[
                'text-sm font-semibold',
                form.bookingFor === opt ? 'text-gray-900' : 'text-gray-500',
              ].join(' ')}
            >
              {opt === 'self' ? 'For Me' : 'For Someone Else'}
            </Text>
          </Pressable>
        ))}
      </View>

      {form.bookingFor === 'other' && (
        <View className="gap-3 pt-2">
          <Input
            label="Recipient's Name"
            value={form.recipientName}
            onChangeText={(text) => setForm((f) => ({ ...f, recipientName: text }))}
            placeholder="Full name"
            autoCapitalize="words"
            error={errors.recipientName}
          />
          <Input
            label="Recipient's Phone"
            value={form.recipientPhone}
            onChangeText={(text) => setForm((f) => ({ ...f, recipientPhone: text }))}
            placeholder="+27 71 234 5678"
            keyboardType="phone-pad"
            error={errors.recipientPhone}
          />
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View className="gap-4">
      <Text className="text-sm text-gray-500">Review your booking details before confirming.</Text>

      <View className="bg-gray-50 rounded-xl p-4 gap-3">
        <SummaryRow label="Service" value={service.business_name} />
        <SummaryRow label="Provider" value={service.provider.name} />
        <View className="border-t border-gray-200 my-1" />
        <SummaryRow label="Date" value={format(form.date, 'EEE, MMM d, yyyy')} />
        <SummaryRow label="Time" value={format(form.time, 'h:mm a')} />
        <SummaryRow label="Address" value={form.address} multiline />
        <View className="border-t border-gray-200 my-1" />
        <SummaryRow
          label="For"
          value={form.bookingFor === 'self' ? 'Myself' : form.recipientName}
        />
        {form.bookingFor === 'other' && (
          <SummaryRow label="Recipient Phone" value={form.recipientPhone} />
        )}
        <View className="border-t border-gray-200 my-1" />
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-700">Amount</Text>
          <Text className="text-base font-bold text-gray-900">
            R{service.base_price.toFixed(2)}
          </Text>
        </View>
      </View>

      <View className="bg-blue-50 rounded-xl p-3 flex-row items-start gap-2.5">
        <CreditCard size={14} color="#1D4ED8" style={{ marginTop: 1 }} />
        <Text className="flex-1 text-xs text-blue-700 leading-4">
          Payment is due after booking confirmation. The provider will accept your booking and payment will be collected.
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          {step > 1 ? (
            <Pressable onPress={goBack} hitSlop={8} className="w-8">
              <ChevronLeft size={22} color={Colors.primary} />
            </Pressable>
          ) : (
            <View className="w-8" />
          )}
          <View className="flex-1 items-center">
            <Text className="text-base font-semibold text-gray-900">
              {STEP_TITLES[step]}
            </Text>
            <Text className="text-xs text-gray-400">Step {step} of 4</Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={8} className="w-8 items-end">
            <X size={20} color={Colors.gray500} />
          </Pressable>
        </View>

        <StepIndicator current={step} total={4} />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </ScrollView>

          <View className="px-4 pb-4 border-t border-gray-100 pt-3">
            {step < 4 ? (
              <Button label="Continue" onPress={goNext} />
            ) : (
              <Button
                label={isCreating ? 'Creating Booking…' : 'Confirm Booking'}
                onPress={handleConfirm}
                isLoading={isCreating}
                disabled={isCreating}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function SummaryRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View
      className={multiline ? 'gap-1' : 'flex-row items-center justify-between'}
    >
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text
        className={[
          'text-sm font-medium text-gray-900',
          multiline ? '' : 'text-right flex-1 ml-4',
        ].join(' ')}
        numberOfLines={multiline ? 3 : 1}
      >
        {value}
      </Text>
    </View>
  );
}
