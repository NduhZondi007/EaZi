import { useCallback } from 'react';
import { useBookingStore } from '@/stores/booking.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { CreateBookingInput } from '@/types/booking.types';
import type { BookingStatus } from '@/types/database.types';

export function useBooking() {
  const profile = useAuthStore(selectProfile);
  const {
    bookings,
    activeBooking,
    isLoading,
    isCreating,
    error,
    loadClientBookings,
    loadProviderBookings,
    loadBooking,
    createBooking,
    cancelBooking,
    clearActiveBooking,
    clearError,
  } = useBookingStore();

  const loadMyBookings = useCallback(async () => {
    if (!profile) return;
    if (profile.role === 'provider') {
      await loadProviderBookings(profile.id);
    } else {
      await loadClientBookings(profile.id);
    }
  }, [profile, loadClientBookings, loadProviderBookings]);

  const handleCreateBooking = useCallback(
    async (input: CreateBookingInput): Promise<string> => {
      return createBooking(input);
    },
    [createBooking],
  );

  const handleCancelBooking = useCallback(
    async (bookingId: string, currentStatus: BookingStatus) => {
      await cancelBooking(bookingId, currentStatus);
    },
    [cancelBooking],
  );

  return {
    bookings,
    activeBooking,
    isLoading,
    isCreating,
    error,
    loadMyBookings,
    loadBooking,
    createBooking: handleCreateBooking,
    cancelBooking: handleCancelBooking,
    clearActiveBooking,
    clearError,
  };
}
