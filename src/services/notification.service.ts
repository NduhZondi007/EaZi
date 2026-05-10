import { Linking, Platform } from 'react-native';
import { userRepository } from '@/repositories/user.repository';
import { navigateTo } from '@/lib/navigationRef';
import { useAuthStore } from '@/stores/auth.store';

type NotifData = Record<string, unknown>;

// Guard: configure the foreground handler only on native
if (Platform.OS !== 'web') {
  // Dynamic require to avoid bundling on web
  const Notifs = require('expo-notifications') as typeof import('expo-notifications');
  Notifs.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

class NotificationService {
  async registerPushToken(userId: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      const Notifs = require('expo-notifications') as typeof import('expo-notifications');
      const Constants = require('expo-constants').default as typeof import('expo-constants').default;

      const { status: existing } = await Notifs.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifs.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return null;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) return null;

      const { data: token } = await Notifs.getExpoPushTokenAsync({ projectId });
      await userRepository.updatePushToken(userId, token);
      return token;
    } catch {
      return null;
    }
  }

  addResponseListener(onTap: (data: NotifData) => void): () => void {
    if (Platform.OS === 'web') return () => {};

    try {
      const Notifs = require('expo-notifications') as typeof import('expo-notifications');
      const sub = Notifs.addNotificationResponseReceivedListener((response) => {
        onTap(response.notification.request.content.data as NotifData);
      });
      return () => sub.remove();
    } catch {
      return () => {};
    }
  }

  addForegroundListener(
    onReceive: (title: string, body: string, data: NotifData) => void,
  ): () => void {
    if (Platform.OS === 'web') return () => {};

    try {
      const Notifs = require('expo-notifications') as typeof import('expo-notifications');
      const sub = Notifs.addNotificationReceivedListener((notification) => {
        onReceive(
          notification.request.content.title ?? '',
          notification.request.content.body ?? '',
          notification.request.content.data as NotifData,
        );
      });
      return () => sub.remove();
    } catch {
      return () => {};
    }
  }

  async setBadge(count: number): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const Notifs = require('expo-notifications') as typeof import('expo-notifications');
      await Notifs.setBadgeCountAsync(count);
    } catch {
      // ignore
    }
  }

  handleNotificationTap(data: NotifData): void {
    const profile = useAuthStore.getState().profile;
    const type = data.type as string | undefined;

    // If the notification includes a deep link URL, open it via Linking
    const url = data.url as string | undefined;
    if (url) {
      Linking.openURL(url).catch(() => navigateTo('Notifications'));
      return;
    }

    if (type === 'booking' && data.booking_id) {
      if (profile?.role === 'provider') {
        navigateTo('ProviderTabs' as never, {
          screen: 'Bookings',
          params: {
            screen: 'ProviderBookingDetail',
            params: { bookingId: data.booking_id as string },
          },
        } as never);
      } else {
        navigateTo('ClientTabs' as never, {
          screen: 'Bookings',
          params: {
            screen: 'BookingDetail',
            params: { bookingId: data.booking_id as string },
          },
        } as never);
      }
    } else if (type === 'chat' && data.room_id) {
      const chatParams = {
        screen: 'Chat',
        params: {
          screen: 'ChatRoom',
          params: {
            roomId: data.room_id as string,
            otherUserId: (data.other_user_id as string) ?? '',
            otherUserName: (data.other_user_name as string) ?? 'User',
          },
        },
      };
      if (profile?.role === 'provider') {
        navigateTo('ProviderTabs' as never, chatParams as never);
      } else {
        navigateTo('ClientTabs' as never, chatParams as never);
      }
    } else if (type === 'payment') {
      navigateTo('ClientTabs' as never, { screen: 'Wallet' } as never);
    } else {
      navigateTo('Notifications');
    }
  }
}

export const notificationService = new NotificationService();
