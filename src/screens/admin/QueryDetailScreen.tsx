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
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  Send,
  User,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { QueryWithUser, QueryMessage } from '@/repositories/admin.repository';
import type { QueryStatus } from '@/types/database.types';
import type { AdminQueriesStackScreenProps } from '@/types/navigation.types';

type Props = AdminQueriesStackScreenProps<'QueryDetail'>;

const STATUS_COLORS: Record<string, string> = {
  open: Colors.error,
  in_progress: Colors.warning,
  resolved: Colors.success,
  closed: Colors.gray500,
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.gray500,
  medium: Colors.info,
  high: Colors.warning,
  urgent: Colors.error,
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const CATEGORY_LABELS: Record<string, string> = {
  booking: 'Booking',
  payment: 'Payment',
  account: 'Account',
  provider: 'Provider',
  technical: 'Technical',
  other: 'Other',
};

export function QueryDetailScreen({ route, navigation }: Props) {
  const { queryId } = route.params;
  const adminProfile = useAuthStore(selectProfile);
  const scrollRef = useRef<ScrollView>(null);

  const [query, setQuery] = useState<QueryWithUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [showResolution, setShowResolution] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getQueryDetail(queryId);
      setQuery(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load query');
    } finally {
      setIsLoading(false);
    }
  }, [queryId]);

  useEffect(() => {
    load();
  }, [load]);

  const messages = (query?.messages ?? []) as QueryMessage[];

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !query || !adminProfile) return;

    const newMsg: QueryMessage = {
      id: `msg_${Date.now()}`,
      sender_id: adminProfile.id,
      sender_name: adminProfile.name,
      content: replyText.trim(),
      created_at: new Date().toISOString(),
    };

    setIsSending(true);
    try {
      const updated = await adminRepository.addQueryMessage(queryId, newMsg, messages);
      setQuery((prev) => prev ? { ...prev, ...updated, user: prev.user } : null);
      setReplyText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

      if (query.status === 'open') {
        await adminRepository.updateQueryStatus(queryId, 'in_progress');
        setQuery((prev) => prev ? { ...prev, status: 'in_progress' } : null);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  }, [replyText, query, adminProfile, queryId, messages]);

  const handleResolve = useCallback(async () => {
    if (!resolutionText.trim()) {
      Alert.alert('Resolution required', 'Please enter a resolution summary.');
      return;
    }
    setIsResolving(true);
    setShowResolution(false);
    try {
      const updated = await adminRepository.updateQueryStatus(queryId, 'resolved', resolutionText.trim());
      setQuery((prev) => prev ? { ...prev, ...updated, user: prev.user } : null);
      setResolutionText('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to resolve query');
    } finally {
      setIsResolving(false);
    }
  }, [resolutionText, queryId]);

  const handleClose = useCallback(async () => {
    Alert.alert('Close Query', 'Mark this query as closed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        onPress: async () => {
          try {
            const updated = await adminRepository.updateQueryStatus(queryId, 'closed');
            setQuery((prev) => prev ? { ...prev, ...updated, user: prev.user } : null);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to close query');
          }
        },
      },
    ]);
  }, [queryId]);

  const isClosed = query?.status === 'closed' || query?.status === 'resolved';

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-xl items-center justify-center active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={Colors.primary} />
          </Pressable>
          <Text className="flex-1 text-base font-bold text-gray-900 ml-2" numberOfLines={1}>
            Query Detail
          </Text>
          {(isSending || isResolving) && (
            <ActivityIndicator size="small" color={Colors.primary} />
          )}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : error ? (
          <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : !query ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm text-gray-500">Query not found</Text>
          </View>
        ) : (
          <>
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
              {/* Query Meta */}
              <View className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 p-4">
                <Text className="text-sm font-bold text-gray-900 mb-1">{query.subject}</Text>
                <View className="flex-row gap-2 mb-2">
                  <Pill
                    label={STATUS_LABELS[query.status] ?? query.status}
                    color={STATUS_COLORS[query.status] ?? Colors.gray500}
                  />
                  <Pill
                    label={PRIORITY_LABELS[query.priority] ?? query.priority}
                    color={PRIORITY_COLORS[query.priority] ?? Colors.gray500}
                  />
                  <Pill
                    label={CATEGORY_LABELS[query.category] ?? query.category}
                    color={Colors.gray500}
                  />
                </View>
                <Text className="text-sm text-gray-600 leading-5">{query.description}</Text>
                <View className="flex-row items-center gap-2 mt-3 pt-2 border-t border-gray-50">
                  <User size={13} color={Colors.gray400} />
                  <Text className="text-xs text-gray-500">{query.user.name}</Text>
                  <Text className="text-xs text-gray-300">·</Text>
                  <Text className="text-xs text-gray-400">
                    {format(new Date(query.created_at), 'dd MMM yyyy HH:mm')}
                  </Text>
                </View>
              </View>

              {/* Resolution (if resolved) */}
              {query.resolution ? (
                <View className="bg-green-50 mx-4 mt-3 rounded-2xl border border-green-100 p-4">
                  <View className="flex-row items-center gap-2 mb-1">
                    <CheckCircle size={14} color={Colors.success} />
                    <Text className="text-xs font-semibold text-green-700">Resolution</Text>
                  </View>
                  <Text className="text-sm text-green-800 leading-5">{query.resolution}</Text>
                </View>
              ) : null}

              {/* Messages */}
              <View className="mx-4 mt-3 mb-4">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Messages ({messages.length})
                </Text>
                {messages.length === 0 ? (
                  <View className="bg-white rounded-xl border border-gray-100 p-4 items-center">
                    <MessageCircle size={20} color={Colors.gray300} />
                    <Text className="text-xs text-gray-400 mt-1">No messages yet</Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {messages.map((msg) => {
                      const isAdmin = adminProfile && msg.sender_id === adminProfile.id;
                      return (
                        <View
                          key={msg.id}
                          className={`rounded-xl p-3 ${
                            isAdmin ? 'bg-[#111111] ml-8' : 'bg-white border border-gray-100 mr-8'
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold mb-1 ${
                              isAdmin ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            {msg.sender_name}
                          </Text>
                          <Text
                            className={`text-sm leading-5 ${
                              isAdmin ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {msg.content}
                          </Text>
                          <Text
                            className={`text-xs mt-1.5 ${
                              isAdmin ? 'text-gray-400' : 'text-gray-400'
                            }`}
                          >
                            {format(new Date(msg.created_at), 'dd MMM HH:mm')}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Resolution Input */}
              {showResolution ? (
                <View className="mx-4 mb-4 bg-white rounded-2xl border border-gray-100 p-4">
                  <Text className="text-xs font-semibold text-gray-700 mb-2">Resolution Summary</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 min-h-[80px]"
                    placeholder="Describe how the issue was resolved…"
                    placeholderTextColor={Colors.gray400}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={resolutionText}
                    onChangeText={setResolutionText}
                  />
                  <View className="flex-row gap-2 mt-3">
                    <Pressable
                      onPress={() => { setShowResolution(false); setResolutionText(''); }}
                      className="flex-1 h-10 rounded-lg border border-gray-200 items-center justify-center active:opacity-75"
                    >
                      <Text className="text-xs font-semibold text-gray-600">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleResolve}
                      disabled={!resolutionText.trim()}
                      className={`flex-1 h-10 rounded-lg items-center justify-center active:opacity-75 ${
                        resolutionText.trim() ? 'bg-[#111111]' : 'bg-gray-300'
                      }`}
                    >
                      <Text className="text-xs font-bold text-white">Mark Resolved</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {/* Action Buttons (if not closed) */}
              {!isClosed ? (
                <View className="mx-4 mb-4 flex-row gap-2">
                  <Pressable
                    onPress={() => setShowResolution(true)}
                    className="flex-1 h-10 rounded-xl bg-green-50 border border-green-100 items-center justify-center active:opacity-75"
                    accessibilityRole="button"
                    accessibilityLabel="Resolve query"
                  >
                    <Text className="text-xs font-bold text-green-700">Resolve</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleClose}
                    className="flex-1 h-10 rounded-xl bg-gray-100 border border-gray-200 items-center justify-center active:opacity-75"
                    accessibilityRole="button"
                    accessibilityLabel="Close query"
                  >
                    <Text className="text-xs font-bold text-gray-600">Close</Text>
                  </Pressable>
                </View>
              ) : null}

              <View className="h-4" />
            </ScrollView>

            {/* Reply Input */}
            {!isClosed ? (
              <View className="bg-white border-t border-gray-100 px-4 py-3 flex-row items-end gap-2">
                <TextInput
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 max-h-24"
                  placeholder="Reply to user…"
                  placeholderTextColor={Colors.gray400}
                  multiline
                  value={replyText}
                  onChangeText={setReplyText}
                  textAlignVertical="top"
                />
                <Pressable
                  onPress={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    replyText.trim() && !isSending ? 'bg-[#111111]' : 'bg-gray-200'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Send reply"
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={16} color={replyText.trim() ? '#FFFFFF' : Colors.gray400} />
                  )}
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20` }}>
      <Text className="text-xs font-medium" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
