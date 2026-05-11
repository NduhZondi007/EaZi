import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, addHours, startOfHour } from 'date-fns';
import { Calendar, Clock, X, Zap } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete';
import { useBookingStore } from '@/stores/booking.store';
import { useAuthStore } from '@/stores/auth.store';
import { locationService } from '@/services/location.service';
import type { Coordinates } from '@/services/location.service';
import type { ServiceWithDetails } from '@/types/service.types';

interface Props {
  visible: boolean;
  service: ServiceWithDetails;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const TODAY = new Date();

const DATE_OPTIONS = [
  { label: 'Today', value: TODAY },
  { label: 'Tomorrow', value: addDays(TODAY, 1) },
  { label: format(addDays(TODAY, 2), 'EEE d MMM'), value: addDays(TODAY, 2) },
];

function buildTimeOptions(): Array<{ label: string; value: Date }> {
  const now = new Date();
  const start = addHours(startOfHour(now), 1);
  const options: Array<{ label: string; value: Date }> = [];
  for (let i = 0; i < 6; i++) {
    const d = addHours(start, i);
    if (d.getHours() >= 7 && d.getHours() <= 18) {
      options.push({ label: format(d, 'h:mm a'), value: d });
    }
  }
  if (options.length === 0) {
    const tomorrow9 = addDays(TODAY, 1);
    tomorrow9.setHours(9, 0, 0, 0);
    options.push({ label: '9:00 AM', value: tomorrow9 });
  }
  return options;
}

export function QuickBookingSheet({ visible, service, onClose, onSuccess }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const createBooking = useBookingStore((s) => s.createBooking);
  const isCreating = useBookingStore((s) => s.isCreating);

  const [address, setAddress] = useState(profile?.home_address ?? profile?.address ?? '');
  const [addressCoords, setAddressCoords] = useState<Coordinates | undefined>();
  const [addressError, setAddressError] = useState('');
  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0].value);
  const [timeOptions] = useState(buildTimeOptions);
  const [selectedTime, setSelectedTime] = useState<Date>(() => timeOptions[0]?.value ?? new Date());
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      setAddress(profile?.home_address ?? profile?.address ?? '');
      setAddressError('');
    }
  }, [visible, profile]);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const granted = await locationService.requestPermission();
      if (!granted) {
        Alert.alert(
          'Location Permission',
          'Please allow location access or enter your address manually.',
        );
        return;
      }
      const coords = await locationService.getCurrentPosition();
      setAddressCoords(coords);
      const addr = await locationService.reverseGeocode(coords);
      setAddress(addr);
      setAddressError('');
    } catch {
      Alert.alert('Location Error', 'Could not get your location. Please enter it manually.');
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handleSelectPlace = useCallback((selectedAddress: string, coords?: Coordinates) => {
    setAddress(selectedAddress);
    setAddressCoords(coords);
    setAddressError('');
  }, []);

  const handleBook = useCallback(async () => {
    if (!profile) return;
    if (!address.trim()) {
      setAddressError('Please enter the service address');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const timeStr = format(selectedTime, 'HH:mm:ss');

    try {
      const bookingId = await createBooking({
        client_id: profile.id,
        provider_id: service.provider.id,
        service_id: service.id,
        service_address: address.trim(),
        date: dateStr,
        time: timeStr,
        amount: service.base_price,
        booking_for: 'self',
        is_quick_booking: true,
      });
      onSuccess(bookingId);
    } catch (err) {
      Alert.alert(
        'Booking Failed',
        err instanceof Error ? err.message : 'Could not create booking',
      );
    }
  }, [profile, address, selectedDate, selectedTime, service, createBooking, onSuccess]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <Zap size={18} color={Colors.primary} />
            <Text className="text-base font-bold text-gray-900">Quick Book</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={Colors.gray500} />
          </Pressable>
        </View>

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
            {/* Service summary */}
            <View className="bg-gray-50 rounded-xl p-4 mb-5">
              <Text className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                Service
              </Text>
              <Text className="text-base font-bold text-gray-900">{service.business_name}</Text>
              <Text className="text-sm text-gray-500">{service.provider.name}</Text>
              <Text className="text-base font-bold text-gray-900 mt-2">
                R{service.base_price.toFixed(2)}
              </Text>
            </View>

            {/* Address */}
            <View className="mb-5">
              <AddressAutocomplete
                label="Service Address"
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  if (text) setAddressError('');
                }}
                onSelectPlace={handleSelectPlace}
                onUseCurrentLocation={handleUseCurrentLocation}
                isLoadingLocation={isLocating}
                placeholder="Enter your address…"
                error={addressError}
              />
            </View>

            {/* Date */}
            <View className="mb-5">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Calendar size={14} color={Colors.gray500} />
                <Text className="text-sm font-semibold text-gray-700">Date</Text>
              </View>
              <View className="flex-row gap-2">
                {DATE_OPTIONS.map((opt) => {
                  const isSelected =
                    format(opt.value, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => setSelectedDate(opt.value)}
                      className={[
                        'flex-1 py-2.5 rounded-xl border-2 items-center',
                        isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-200',
                      ].join(' ')}
                      accessibilityRole="button"
                      accessibilityLabel={opt.label}
                    >
                      <Text
                        className={[
                          'text-sm font-semibold',
                          isSelected ? 'text-white' : 'text-gray-700',
                        ].join(' ')}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Time */}
            {timeOptions.length > 0 && (
              <View className="mb-2">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Clock size={14} color={Colors.gray500} />
                  <Text className="text-sm font-semibold text-gray-700">Time</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {timeOptions.map((opt) => {
                    const isSelected =
                      format(opt.value, 'HH:mm') === format(selectedTime, 'HH:mm');
                    return (
                      <Pressable
                        key={opt.label}
                        onPress={() => setSelectedTime(opt.value)}
                        className={[
                          'px-4 py-2.5 rounded-xl border-2',
                          isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-200',
                        ].join(' ')}
                        accessibilityRole="button"
                        accessibilityLabel={opt.label}
                      >
                        <Text
                          className={[
                            'text-sm font-semibold',
                            isSelected ? 'text-white' : 'text-gray-700',
                          ].join(' ')}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* CTA */}
          <View className="px-4 pb-4 border-t border-gray-100 pt-3">
            <Pressable
              onPress={handleBook}
              disabled={isCreating}
              className={[
                'h-12 rounded-xl items-center justify-center flex-row gap-2',
                !isCreating ? 'bg-[#111111]' : 'bg-gray-200',
              ].join(' ')}
              accessibilityRole="button"
              accessibilityLabel="Confirm quick booking"
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Zap size={16} color="#fff" />
                  <Text className="text-sm font-bold text-white">
                    Book Now · R{service.base_price.toFixed(2)}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
