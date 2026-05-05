import { create } from 'zustand';
import { bookingRepository } from '@/repositories/booking.repository';
import type { BookingWithDetails, CreateBookingInput } from '@/types/booking.types';
import type { BookingStatus } from '@/types/database.types';

interface BookingState {
  bookings: BookingWithDetails[];
  activeBooking: BookingWithDetails | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  loadClientBookings(clientId: string): Promise<void>;
  loadProviderBookings(providerId: string): Promise<void>;
  loadBooking(bookingId: string): Promise<void>;
  createBooking(input: CreateBookingInput): Promise<string>;
  cancelBooking(bookingId: string, currentStatus: BookingStatus): Promise<void>;
  updateBookingRealtime(updated: Record<string, unknown>): void;
  clearActiveBooking(): void;
  clearError(): void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  activeBooking: null,
  isLoading: false,
  isCreating: false,
  error: null,

  async loadClientBookings(clientId: string) {
    set({ isLoading: true, error: null });
    try {
      const bookings = await bookingRepository.findByClient(clientId);
      set({ bookings, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load bookings',
      });
    }
  },

  async loadProviderBookings(providerId: string) {
    set({ isLoading: true, error: null });
    try {
      const bookings = await bookingRepository.findByProvider(providerId);
      set({ bookings, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load bookings',
      });
    }
  },

  async loadBooking(bookingId: string) {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingRepository.findById(bookingId);
      set({ activeBooking: booking, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load booking',
      });
    }
  },

  async createBooking(input: CreateBookingInput): Promise<string> {
    set({ isCreating: true, error: null });
    try {
      const booking = await bookingRepository.create(input);
      const updated = await bookingRepository.findByClient(input.client_id);
      set({ bookings: updated, isCreating: false });
      return booking.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      set({ isCreating: false, error: message });
      throw new Error(message);
    }
  },

  async cancelBooking(bookingId: string, currentStatus: BookingStatus) {
    set({ isLoading: true, error: null });
    try {
      await bookingRepository.cancel(bookingId, currentStatus);
      const active = get().activeBooking;
      if (active) {
        await get().loadBooking(bookingId);
      }
      set({ isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to cancel booking',
      });
    }
  },

  updateBookingRealtime(updated: Record<string, unknown>) {
    const bookingId = updated.id as string;
    const newStatus = updated.status as BookingStatus;

    set((state) => {
      const active = state.activeBooking;
      const updatedActive =
        active && active.id === bookingId
          ? { ...active, ...updated, status: newStatus }
          : active;

      const updatedBookings = state.bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updated, status: newStatus } : b,
      );

      return { activeBooking: updatedActive, bookings: updatedBookings };
    });
  },

  clearActiveBooking() {
    set({ activeBooking: null });
  },

  clearError() {
    set({ error: null });
  },
}));

export const selectBookings = (s: BookingState) => s.bookings;
export const selectActiveBooking = (s: BookingState) => s.activeBooking;
export const selectIsBookingLoading = (s: BookingState) => s.isLoading;
export const selectIsCreating = (s: BookingState) => s.isCreating;
export const selectBookingError = (s: BookingState) => s.error;
