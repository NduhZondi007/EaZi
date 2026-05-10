import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { MessageSquare } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { ChatRoomWithDetails } from '@/types/chat.types';

interface ChatRoomItemProps {
  room: ChatRoomWithDetails;
  currentUserId: string;
  onPress: (room: ChatRoomWithDetails) => void;
}

function formatRoomTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  } catch {
    return '';
  }
}

export const ChatRoomItem = React.memo(function ChatRoomItem({
  room,
  currentUserId,
  onPress,
}: ChatRoomItemProps) {
  const { otherParticipant, lastMessage, unreadCount } = room;
  const timeLabel = lastMessage ? formatRoomTime(lastMessage.created_at) : '';
  const isOwn = lastMessage?.sender_id === currentUserId;
  const preview = lastMessage
    ? `${isOwn ? 'You: ' : ''}${lastMessage.content}`
    : 'No messages yet';

  return (
    <Pressable
      onPress={() => onPress(room)}
      className="flex-row items-center px-4 py-3 bg-white active:bg-gray-50"
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${otherParticipant.name}`}
    >
      {/* Avatar */}
      {otherParticipant.profile_image_url ? (
        <Image
          source={{ uri: otherParticipant.profile_image_url }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
          <MessageSquare size={20} color={Colors.gray400} />
        </View>
      )}

      {/* Content */}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text className="text-sm font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
            {otherParticipant.name}
          </Text>
          <Text className="text-[11px] text-gray-400">{timeLabel}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm flex-1 mr-2 ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {unreadCount > 0 && (
            <View className="min-w-[20px] h-5 bg-[#111111] rounded-full items-center justify-center px-1">
              <Text className="text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});
