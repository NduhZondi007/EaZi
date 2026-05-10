import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Colors } from '@/constants/colors';
import { realtimeManager } from '@/services/realtime.manager';
import {
  useChatStore,
  selectMessages,
  selectIsMessagesLoading,
  selectIsSending,
  selectHasMoreMessages,
} from '@/stores/chat.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { ChatStackScreenProps } from '@/types/navigation.types';
import type { ChatMessage } from '@/types/chat.types';

type Props = ChatStackScreenProps<'ChatRoom'>;

export function ChatRoomScreen({ route, navigation }: Props) {
  const { roomId, otherUserId, otherUserName } = route.params;

  const profile = useAuthStore(selectProfile);
  const messages = useChatStore(selectMessages(roomId));
  const isLoading = useChatStore(selectIsMessagesLoading);
  const isSending = useChatStore(selectIsSending);
  const hasMore = useChatStore(selectHasMoreMessages(roomId));
  const { loadMessages, loadMoreMessages, sendMessage, receiveMessage, markRead, setActiveRoom } =
    useChatStore();

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    setActiveRoom(roomId);
    loadMessages(roomId);

    const unsubscribe = realtimeManager.subscribeToChatMessages(roomId, (payload) => {
      receiveMessage(payload.new);
    });

    return () => {
      unsubscribe();
      setActiveRoom(null);
    };
  }, [roomId, loadMessages, receiveMessage, setActiveRoom]);

  useEffect(() => {
    if (messages.length > 0 && profile?.id) {
      markRead(roomId, profile.id);
    }
  }, [roomId, messages.length, profile?.id, markRead]);

  const handleSend = useCallback(
    (content: string) => {
      if (!profile?.id) return;
      sendMessage(roomId, profile.id, content);
    },
    [roomId, profile?.id, sendMessage],
  );

  const handleEndReached = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore) return;
    isLoadingMoreRef.current = true;
    await loadMoreMessages(roomId);
    isLoadingMoreRef.current = false;
  }, [roomId, hasMore, loadMoreMessages]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatBubble message={item} isOwn={item.sender_id === profile?.id} />
    ),
    [profile?.id],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const ListFooterComponent = hasMore ? (
    <View className="items-center py-3">
      <ActivityIndicator size="small" color={Colors.gray400} />
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-3 py-3 border-b border-gray-100 bg-white">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={Colors.primary} />
        </Pressable>
        <View className="flex-row items-center gap-2 ml-2 flex-1">
          <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
            <MessageSquare size={16} color={Colors.gray400} />
          </View>
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {otherUserName}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isLoading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            inverted
            contentContainerStyle={{ paddingVertical: 12 }}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={ListFooterComponent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
        <ChatInput onSend={handleSend} isSending={isSending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
