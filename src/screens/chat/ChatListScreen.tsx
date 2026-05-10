import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Bell, MessageSquare } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChatRoomItem } from '@/components/chat/ChatRoomItem';
import { Colors } from '@/constants/colors';
import {
  useChatStore,
  selectRooms,
  selectIsRoomsLoading,
  selectChatError,
} from '@/stores/chat.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import {
  useNotificationStore,
  selectUnreadCount,
} from '@/stores/notification.store';
import { navigateTo } from '@/lib/navigationRef';
import type { ChatRoomWithDetails } from '@/types/chat.types';
import type { ChatStackScreenProps } from '@/types/navigation.types';

type Props = ChatStackScreenProps<'ChatList'>;

export function ChatListScreen({ navigation }: Props) {
  const profile = useAuthStore(selectProfile);
  const rooms = useChatStore(selectRooms);
  const isLoading = useChatStore(selectIsRoomsLoading);
  const error = useChatStore(selectChatError);
  const { loadRooms } = useChatStore();
  const unreadNotifCount = useNotificationStore(selectUnreadCount);

  const load = useCallback(() => {
    if (profile?.id) loadRooms(profile.id);
  }, [profile?.id, loadRooms]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = useCallback(
    (room: ChatRoomWithDetails) => {
      navigation.navigate('ChatRoom', {
        roomId: room.id,
        otherUserId: room.otherParticipant.id,
        otherUserName: room.otherParticipant.name,
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-base font-semibold text-gray-900">Messages</Text>
        <TouchableOpacity
          onPress={() => navigateTo('Notifications')}
          className="relative p-1"
          hitSlop={8}
        >
          <Bell size={22} color="#111111" />
          {unreadNotifCount > 0 && (
            <View className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-[#111111] items-center justify-center px-1">
              <Text className="text-white text-[9px] font-bold">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <View className="mx-4 mt-3 p-3 bg-red-50 rounded-xl">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      ) : null}

      {isLoading && rooms.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlashList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatRoomItem
              room={item}
              currentUserId={profile?.id ?? ''}
              onPress={handlePress}
            />
          )}
          estimatedItemSize={72}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 ml-[76px]" />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={load}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-24">
              <EmptyState
                icon={<MessageSquare size={40} color={Colors.gray400} />}
                title="No messages yet"
                subtitle="Your conversations will appear here once you start chatting"
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
