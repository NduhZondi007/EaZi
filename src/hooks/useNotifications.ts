import { useEffect } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '@/services/notification.service';
import { realtimeManager } from '@/services/realtime.manager';
import { useAuthStore, selectUser } from '@/stores/auth.store';
import {
  useNotificationStore,
  selectUnreadCount,
} from '@/stores/notification.store';

export function useNotifications(): void {
  const user = useAuthStore(selectUser);
  const { loadNotifications, loadUnreadCount, receiveNotification } = useNotificationStore();
  const unreadCount = useNotificationStore(selectUnreadCount);

  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;

    loadNotifications(userId);
    loadUnreadCount(userId);

    notificationService.registerPushToken(userId);

    const removeForeground = notificationService.addForegroundListener(
      (_title, _body, data) => {
        receiveNotification(data);
      },
    );

    const removeResponse = notificationService.addResponseListener((data) => {
      notificationService.handleNotificationTap(data);
    });

    const unsubscribeRealtime = realtimeManager.subscribeToNotifications(
      userId,
      (payload) => {
        receiveNotification(payload.new);
      },
    );

    return () => {
      removeForeground();
      removeResponse();
      unsubscribeRealtime();
    };
  }, [user?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      notificationService.setBadge(unreadCount);
    }
  }, [unreadCount]);
}
