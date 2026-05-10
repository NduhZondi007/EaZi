import React, { useState, useRef } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Send } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface ChatInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
}

export function ChatInput({ onSend, isSending }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const canSend = text.trim().length > 0 && !isSending;

  return (
    <View className="flex-row items-end gap-2 px-3 py-2 bg-white border-t border-gray-100">
      <View className="flex-1 bg-[#F3F4F6] rounded-2xl px-3 py-2 min-h-[40px] max-h-[120px] justify-center">
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor="#9CA3AF"
          multiline
          className="text-sm text-gray-900 p-0"
          style={{ maxHeight: 100 }}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
      </View>
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          canSend ? 'bg-[#111111]' : 'bg-gray-200'
        }`}
        accessibilityRole="button"
        accessibilityLabel="Send message"
      >
        {isSending ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Send size={16} color={canSend ? '#FFFFFF' : '#9CA3AF'} />
        )}
      </Pressable>
    </View>
  );
}
