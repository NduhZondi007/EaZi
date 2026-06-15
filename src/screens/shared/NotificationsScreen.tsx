import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Bell,
  Calendar,
  CreditCard,
  MessageSquare,
  Tag,
  ShieldCheck,
  ChevronLeft,
  CheckCheck,
} from 'lucide-react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types/navigation.types';
import type { NotificationRow, NotificationType } from '@/types/database.types';
import {
  useNotificationStore,
  selectNotifications,
  selectIsNotifLoading,
  selectHasMoreNotifs,
} from '@/stores/notification.store';
import { notificationService } from '@/services/notification.service';
import { useAuthStore, selectUser } from '@/stores/auth.store';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

function typeIcon(type: NotificationType): React.ReactElement {
  const size = 20;
  const color = '#111111';
  switch (type) {
    case 'booking':
      return <Calendar size={size} color={color} />;
    case 'payment':
      return <CreditCard size={size} color={color} />;
    case 'chat':
      return <MessageSquare size={size} color={color} />;
    case 'promotion':
      return <Tag size={size} color={color} />;
    case 'verification':
      return <ShieldCheck size={size} color={color} />;
    default:
      return <Bell size={size} color={color} />;
  }
}

interface ItemProps {
  item: NotificationRow;
  onPress: (n: NotificationRow) => void;
}

const NotificationItem = React.memo(function NotificationItem({ item, onPress }: ItemProps) {
  const timeAgo = formatDistanceToNow(parseISO(item.created_at), { addSuffix: true });

  return (
    <Pressable
      onPress={() => onPress(item)}
      className={`flex-row items-start px-4 py-3 gap-3 ${!item.read ? 'bg-green-50' : 'bg-white'}`}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mt-0.5 flex-shrink-0">
        {typeIcon(item.type)}
      </View>
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={`flex-1 text-sm ${!item.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}
          >
            {item.title}
          </Text>
          {!item.read && (
            <View className="w-2 h-2 rounded-full bg-[#3ECF8E] mt-1.5 flex-shrink-0" />
          )}
        </View>
        <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={2}>
          {item.message}
        </Text>
        <Text className="text-xs text-gray-400 mt-1">{timeAgo}</Text>
      </View>
    </Pressable>
  );
});

export function NotificationsScreen({ navigation }: Props) {
  const user = useAuthStore(selectUser);
  const notifications = useNotificationStore(selectNotifications);
  const isLoading = useNotificationStore(selectIsNotifLoading);
  const hasMore = useNotificationStore(selectHasMoreNotifs);
  const { markRead, markAllRead, loadMore } = useNotificationStore();

  const handlePress = useCallback(
    (notif: NotificationRow) => {
      if (!notif.read) markRead(notif.id);
      notificationService.handleNotificationTap(notif.data);
    },
    [markRead],
  );

  const handleMarkAllRead = useCallback(() => {
    if (user) markAllRead(user.id);
  }, [user, markAllRead]);

  const handleLoadMore = useCallback(() => {
    if (user && hasMore && !isLoading) loadMore(user.id);
  }, [user, hasMore, isLoading, loadMore]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-gray-100">
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-1"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#111111" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Notifications</Text>
        <Pressable
          onPress={handleMarkAllRead}
          className="p-1"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mark all as read"
        >
          <CheckCheck size={20} color="#3ECF8E" />
        </Pressable>
      </View>

      <FlashList
        data={notifications}
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-gray-100 ml-[68px]" />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-20 gap-3">
              <Bell size={40} color="#D1D5DB" />
              <Text className="text-gray-400 text-base">No notifications yet</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#111111" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
