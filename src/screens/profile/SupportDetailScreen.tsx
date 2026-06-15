import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { ChevronLeft, Send } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import { queryRepository, type QueryRow, type QueryMessage } from '@/repositories/query.repository';
import type { ProfileStackScreenProps } from '@/types/navigation.types';

type Props = ProfileStackScreenProps<'SupportDetail'>;

const STATUS_BADGE: Record<QueryRow['status'], 'default' | 'info' | 'success' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
};

export function SupportDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { queryId } = route.params;
  const profile = useAuthStore(selectProfile);

  const [query, setQuery] = useState<QueryRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const data = await queryRepository.findById(queryId);
      setQuery(data);
    } catch {
      Alert.alert('Error', 'Failed to load query details.');
    } finally {
      setIsLoading(false);
    }
  }, [queryId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    if (!message.trim() || !profile || !query) return;
    const newMessage: QueryMessage = {
      sender_id: profile.id,
      sender_name: profile.name,
      content: message.trim(),
      created_at: new Date().toISOString(),
    };
    setIsSending(true);
    try {
      const updated = await queryRepository.addMessage(query.id, newMessage);
      setQuery(updated);
      setMessage('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#111111" />
      </SafeAreaView>
    );
  }

  if (!query) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-base text-[#6B7280] text-center">Query not found.</Text>
      </SafeAreaView>
    );
  }

  const isOpen = query.status === 'open' || query.status === 'in_progress';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-4 border-b border-[#E5E7EB]">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3"
        >
          <ChevronLeft size={24} color="#111111" />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-[#111111]" numberOfLines={1}>
          {query.subject}
        </Text>
        <Badge label={query.status.replace('_', ' ')} variant={STATUS_BADGE[query.status]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View className="bg-[#F3F4F6] rounded-xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Badge label={query.category} variant="outline" />
              <Text className="text-xs text-[#9CA3AF]">
                {format(new Date(query.created_at), 'dd MMM yyyy')}
              </Text>
            </View>
            <Text className="text-sm text-[#374151]">{query.description}</Text>
          </View>

          {query.messages.map((msg, index) => {
            const isOwn = msg.sender_id === profile?.id;
            return (
              <View
                key={index}
                className={`max-w-[80%] ${isOwn ? 'self-end' : 'self-start'}`}
              >
                <View
                  className={`rounded-2xl px-4 py-3 ${
                    isOwn ? 'bg-[#111111]' : 'bg-[#F3F4F6]'
                  }`}
                >
                  <Text
                    className={`text-sm ${isOwn ? 'text-white' : 'text-[#111111]'}`}
                  >
                    {msg.content}
                  </Text>
                </View>
                <Text className="text-xs text-[#9CA3AF] mt-1 px-1">
                  {msg.sender_name} · {format(new Date(msg.created_at), 'HH:mm')}
                </Text>
              </View>
            );
          })}

          {query.resolution && (
            <View className="border border-[#16A34A] rounded-xl p-4 bg-[#DCFCE7]">
              <Text className="text-xs font-semibold text-[#16A34A] mb-1">Resolution</Text>
              <Text className="text-sm text-[#374151]">{query.resolution}</Text>
            </View>
          )}
        </ScrollView>

        {isOpen && (
          <View className="flex-row items-end px-4 py-3 border-t border-[#E5E7EB] gap-3">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message…"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
              className="flex-1 bg-[#F3F4F6] rounded-2xl px-4 py-3 text-sm text-[#111111] max-h-24"
              accessibilityLabel="Message input"
            />
            <Pressable
              onPress={handleSend}
              disabled={!message.trim() || isSending}
              className="w-11 h-11 bg-[#111111] rounded-full items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={({ pressed }) => [{ opacity: pressed || !message.trim() || isSending ? 0.5 : 1 }]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
