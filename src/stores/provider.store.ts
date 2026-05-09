import { create } from 'zustand';
import { bookingRepository } from '@/repositories/booking.repository';
import { serviceRepository } from '@/repositories/service.repository';
import { walletRepository } from '@/repositories/wallet.repository';
import type { ServiceRow, BookingStatus } from '@/types/database.types';
import type { BookingWithDetails } from '@/types/booking.types';
import type { ProviderStats, ServiceCreateInput, ServiceUpdateInput } from '@/types/service.types';

interface ProviderState {
  stats: ProviderStats | null;
  myServices: ServiceRow[];
  todaysBookings: BookingWithDetails[];
  pendingBookings: BookingWithDetails[];
  allBookings: BookingWithDetails[];
  activeBooking: BookingWithDetails | null;

  isStatsLoading: boolean;
  isServicesLoading: boolean;
  isBookingsLoading: boolean;
  isActionLoading: boolean;
  error: string | null;

  loadDashboard(providerId: string): Promise<void>;
  loadMyServices(providerId: string): Promise<void>;
  loadAllBookings(providerId: string): Promise<void>;
  loadBooking(bookingId: string): Promise<void>;

  createService(providerId: string, input: ServiceCreateInput, imageUris: string[]): Promise<ServiceRow>;
  updateService(serviceId: string, input: ServiceUpdateInput, newImageUris: string[], existingUrls: string[]): Promise<ServiceRow>;
  removeService(serviceId: string): Promise<void>;
  toggleAvailability(serviceId: string, isAvailable: boolean): Promise<void>;

  acceptBooking(bookingId: string, currentStatus: BookingStatus): Promise<void>;
  declineBooking(bookingId: string, currentStatus: BookingStatus): Promise<void>;
  advanceBookingStatus(bookingId: string, currentStatus: BookingStatus, newStatus: BookingStatus): Promise<void>;
  updateBookingRealtime(updated: Record<string, unknown>): void;

  clearActiveBooking(): void;
  clearError(): void;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  stats: null,
  myServices: [],
  todaysBookings: [],
  pendingBookings: [],
  allBookings: [],
  activeBooking: null,

  isStatsLoading: false,
  isServicesLoading: false,
  isBookingsLoading: false,
  isActionLoading: false,
  error: null,

  async loadDashboard(providerId: string) {
    set({ isStatsLoading: true, error: null });
    try {
      const [statsBase, todaysBookings, pendingBookings, wallet] = await Promise.all([
        bookingRepository.getProviderStats(providerId),
        bookingRepository.findTodayByProvider(providerId),
        bookingRepository.findPendingByProvider(providerId),
        walletRepository.findByUserId(providerId),
      ]);

      const stats: ProviderStats = {
        ...statsBase,
        availableBalance: wallet?.balance ?? 0,
      };

      set({ stats, todaysBookings, pendingBookings, isStatsLoading: false });
    } catch (err) {
      set({
        isStatsLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard',
      });
    }
  },

  async loadMyServices(providerId: string) {
    set({ isServicesLoading: true, error: null });
    try {
      const myServices = await serviceRepository.findByProvider(providerId);
      set({ myServices, isServicesLoading: false });
    } catch (err) {
      set({
        isServicesLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load services',
      });
    }
  },

  async loadAllBookings(providerId: string) {
    set({ isBookingsLoading: true, error: null });
    try {
      const allBookings = await bookingRepository.findByProvider(providerId);
      set({ allBookings, isBookingsLoading: false });
    } catch (err) {
      set({
        isBookingsLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load bookings',
      });
    }
  },

  async loadBooking(bookingId: string) {
    set({ isBookingsLoading: true, error: null });
    try {
      const booking = await bookingRepository.findById(bookingId);
      set({ activeBooking: booking, isBookingsLoading: false });
    } catch (err) {
      set({
        isBookingsLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load booking',
      });
    }
  },

  async createService(providerId: string, input: ServiceCreateInput, imageUris: string[]) {
    set({ isActionLoading: true, error: null });
    try {
      let gallery: string[] = [];
      if (imageUris.length > 0) {
        gallery = await serviceRepository.uploadGalleryImages(providerId, imageUris);
      }

      const service = await serviceRepository.create(providerId, { ...input, gallery });
      set((state) => ({
        myServices: [service, ...state.myServices],
        isActionLoading: false,
      }));
      return service;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create service';
      set({ isActionLoading: false, error: message });
      throw new Error(message);
    }
  },

  async updateService(
    serviceId: string,
    input: ServiceUpdateInput,
    newImageUris: string[],
    existingUrls: string[],
  ) {
    set({ isActionLoading: true, error: null });
    try {
      const providerId = get().myServices.find((s) => s.id === serviceId)?.provider_id ?? '';
      let newUrls: string[] = [];

      if (newImageUris.length > 0 && providerId) {
        newUrls = await serviceRepository.uploadGalleryImages(providerId, newImageUris);
      }

      const gallery = [...existingUrls, ...newUrls];
      const service = await serviceRepository.update(serviceId, { ...input, gallery });

      set((state) => ({
        myServices: state.myServices.map((s) => (s.id === serviceId ? service : s)),
        isActionLoading: false,
      }));
      return service;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update service';
      set({ isActionLoading: false, error: message });
      throw new Error(message);
    }
  },

  async removeService(serviceId: string) {
    set({ isActionLoading: true, error: null });
    try {
      await serviceRepository.remove(serviceId);
      set((state) => ({
        myServices: state.myServices.filter((s) => s.id !== serviceId),
        isActionLoading: false,
      }));
    } catch (err) {
      set({
        isActionLoading: false,
        error: err instanceof Error ? err.message : 'Failed to delete service',
      });
    }
  },

  async toggleAvailability(serviceId: string, isAvailable: boolean) {
    set({ isActionLoading: true, error: null });
    try {
      const updated = await serviceRepository.toggleAvailability(serviceId, isAvailable);
      set((state) => ({
        myServices: state.myServices.map((s) => (s.id === serviceId ? updated : s)),
        isActionLoading: false,
      }));
    } catch (err) {
      set({
        isActionLoading: false,
        error: err instanceof Error ? err.message : 'Failed to update availability',
      });
    }
  },

  async acceptBooking(bookingId: string, currentStatus: BookingStatus) {
    set({ isActionLoading: true, error: null });
    try {
      await bookingRepository.acceptBooking(bookingId, currentStatus);
      await get().loadBooking(bookingId);
      set({ isActionLoading: false });
    } catch (err) {
      set({
        isActionLoading: false,
        error: err instanceof Error ? err.message : 'Failed to accept booking',
      });
    }
  },

  async declineBooking(bookingId: string, currentStatus: BookingStatus) {
    set({ isActionLoading: true, error: null });
    try {
      await bookingRepository.declineBooking(bookingId, currentStatus);
      await get().loadBooking(bookingId);
      set({ isActionLoading: false });
    } catch (err) {
      set({
        isActionLoading: false,
        error: err instanceof Error ? err.message : 'Failed to decline booking',
      });
    }
  },

  async advanceBookingStatus(
    bookingId: string,
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
  ) {
    set({ isActionLoading: true, error: null });
    try {
      await bookingRepository.updateStatus(bookingId, currentStatus, newStatus);
      await get().loadBooking(bookingId);
      set({ isActionLoading: false });
    } catch (err) {
      set({
        isActionLoading: false,
        error: err instanceof Error ? err.message : 'Failed to update booking status',
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

      const updatedAll = state.allBookings.map((b) =>
        b.id === bookingId ? { ...b, ...updated, status: newStatus } : b,
      );
      const updatedPending = state.pendingBookings.filter(
        (b) => !(b.id === bookingId && newStatus !== 'confirmed'),
      );

      return {
        activeBooking: updatedActive,
        allBookings: updatedAll,
        pendingBookings: updatedPending,
      };
    });
  },

  clearActiveBooking() {
    set({ activeBooking: null });
  },

  clearError() {
    set({ error: null });
  },
}));

export const selectProviderStats = (s: ProviderState) => s.stats;
export const selectMyServices = (s: ProviderState) => s.myServices;
export const selectTodaysBookings = (s: ProviderState) => s.todaysBookings;
export const selectPendingBookings = (s: ProviderState) => s.pendingBookings;
export const selectAllProviderBookings = (s: ProviderState) => s.allBookings;
export const selectProviderActiveBooking = (s: ProviderState) => s.activeBooking;
export const selectIsStatsLoading = (s: ProviderState) => s.isStatsLoading;
export const selectIsServicesLoading = (s: ProviderState) => s.isServicesLoading;
export const selectIsBookingsLoading = (s: ProviderState) => s.isBookingsLoading;
export const selectIsActionLoading = (s: ProviderState) => s.isActionLoading;
export const selectProviderError = (s: ProviderState) => s.error;
