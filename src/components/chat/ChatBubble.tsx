import React from 'react';
import { Text, View } from 'react-native';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import type { ChatMessage } from '@/types/chat.types';
import type { MessageStatus } from '@/types/database.types';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'read') return <CheckCheck size={12} color="#3ECF8E" />;
  if (status === 'delivered') return <Check size={12} color="#9CA3AF" />;
  return <Clock size={12} color="#9CA3AF" />;
}

function formatMessageTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'dd MMM HH:mm');
  } catch {
    return '';
  }
}

export const ChatBubble = React.memo(function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  return (
    <View
      className={`flex-row mb-1 px-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-[78%] rounded-2xl px-3 py-2 ${
          isOwn ? 'bg-[#111111] rounded-tr-sm' : 'bg-[#F3F4F6] rounded-tl-sm'
        }`}
      >
        <Text className={`text-sm leading-5 ${isOwn ? 'text-white' : 'text-gray-900'}`}>
          {message.content}
        </Text>
        <View className={`flex-row items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <Text className={`text-[10px] ${isOwn ? 'text-gray-400' : 'text-gray-400'}`}>
            {formatMessageTime(message.created_at)}
          </Text>
          {isOwn && <StatusIcon status={message.status} />}
        </View>
      </View>
    </View>
  );
});
