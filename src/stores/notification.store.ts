import { create } from 'zustand';
import { notificationRepository } from '@/repositories/notification.repository';
import type { NotificationRow } from '@/types/database.types';

const PAGE_SIZE = 20;

interface NotificationState {
  notifications: NotificationRow[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;

  loadNotifications(userId: string): Promise<void>;
  loadMore(userId: string): Promise<void>;
  loadUnreadCount(userId: string): Promise<void>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  receiveNotification(raw: Record<string, unknown>): void;
  clearError(): void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: false,
  error: null,

  async loadNotifications(userId: string) {
    set({ isLoading: true, error: null });
    try {
      const items = await notificationRepository.findByUserId(userId, PAGE_SIZE);
      set({
        notifications: items,
        hasMore: items.length === PAGE_SIZE,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load notifications',
      });
    }
  },

  async loadMore(userId: string) {
    const current = get().notifications;
    if (!get().hasMore || get().isLoading) return;
    const oldest = current[current.length - 1];
    if (!oldest) return;

    try {
      const older = await notificationRepository.findByUserId(
        userId,
        PAGE_SIZE,
        oldest.created_at,
      );
      set((state) => ({
        notifications: [...state.notifications, ...older],
        hasMore: older.length === PAGE_SIZE,
      }));
    } catch {
      // Silently ignore pagination errors
    }
  },

  async loadUnreadCount(userId: string) {
    try {
      const count = await notificationRepository.getUnreadCount(userId);
      set({ unreadCount: count });
    } catch {
      // Non-critical
    }
  },

  async markRead(notificationId: string) {
    try {
      await notificationRepository.markRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to mark as read' });
    }
  },

  async markAllRead(userId: string) {
    try {
      await notificationRepository.markAllRead(userId);
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: true,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to mark all as read' });
    }
  },

  receiveNotification(raw: Record<string, unknown>) {
    const newNotif = raw as NotificationRow;

    set((state) => {
      // Prevent duplicates
      if (state.notifications.some((n) => n.id === newNotif.id)) return state;
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  clearError() {
    set({ error: null });
  },
}));

export const selectNotifications = (s: NotificationState) => s.notifications;
export const selectUnreadCount = (s: NotificationState) => s.unreadCount;
export const selectIsNotifLoading = (s: NotificationState) => s.isLoading;
export const selectHasMoreNotifs = (s: NotificationState) => s.hasMore;
export const selectNotifError = (s: NotificationState) => s.error;
