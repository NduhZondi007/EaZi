import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ChevronRight, HelpCircle, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import type { QueryWithUser } from '@/repositories/admin.repository';
import type { QueryStatus } from '@/types/database.types';
import type { AdminQueriesStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<AdminQueriesStackParamList>;

type StatusFilter = 'all' | QueryStatus;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.gray500,
  medium: Colors.info,
  high: Colors.warning,
  urgent: Colors.error,
};

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

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function QueriesListScreen() {
  const navigation = useNavigation<Nav>();
  const [queries, setQueries] = useState<QueryWithUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.listQueries(
        statusFilter === 'all' ? undefined : statusFilter,
      );
      setQueries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load queries');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <HelpCircle size={18} color={Colors.primary} />
          <Text className="text-lg font-bold text-gray-900">Support Queries</Text>
          {queries.length > 0 && (
            <View className="ml-auto bg-gray-100 rounded-full px-2 py-0.5">
              <Text className="text-xs font-medium text-gray-600">{queries.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        >
          {STATUS_TABS.map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full border ${
                statusFilter === tab.value
                  ? 'bg-[#111111] border-[#111111]'
                  : 'bg-white border-gray-200'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${tab.label}`}
            >
              <Text
                className={`text-xs font-medium ${
                  statusFilter === tab.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} />
        }
      >
        {isLoading && queries.length === 0 ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : queries.length === 0 ? (
          <View className="mt-16 items-center px-8">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
              <MessageCircle size={32} color={Colors.gray400} />
            </View>
            <Text className="text-base font-semibold text-gray-700 text-center">
              No queries found
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-1">
              {statusFilter === 'all' ? 'No support tickets yet' : `No ${STATUS_LABELS[statusFilter]} queries`}
            </Text>
          </View>
        ) : (
          <View className="px-4 pt-3 pb-6 gap-2">
            {queries.map((query) => (
              <QueryCard
                key={query.id}
                query={query}
                priorityColors={PRIORITY_COLORS}
                statusColors={STATUS_COLORS}
                priorityLabels={PRIORITY_LABELS}
                statusLabels={STATUS_LABELS}
                onPress={() => navigation.navigate('QueryDetail', { queryId: query.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QueryCard({
  query,
  priorityColors,
  statusColors,
  priorityLabels,
  statusLabels,
  onPress,
}: {
  query: QueryWithUser;
  priorityColors: Record<string, string>;
  statusColors: Record<string, string>;
  priorityLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  onPress: () => void;
}) {
  const priorityColor = priorityColors[query.priority] ?? Colors.gray500;
  const statusColor = statusColors[query.status] ?? Colors.gray500;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl border border-gray-100 px-4 py-3 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`View query: ${query.subject}`}
    >
      <View className="flex-row items-start justify-between gap-2 mb-1.5">
        <Text className="flex-1 text-sm font-semibold text-gray-900" numberOfLines={1}>
          {query.subject}
        </Text>
        <ChevronRight size={16} color={Colors.gray300} />
      </View>

      <Text className="text-xs text-gray-500 mb-2" numberOfLines={2}>
        {query.description}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${priorityColor}20` }}
          >
            <Text className="text-xs font-medium" style={{ color: priorityColor }}>
              {priorityLabels[query.priority] ?? query.priority}
            </Text>
          </View>
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            <Text className="text-xs font-medium" style={{ color: statusColor }}>
              {statusLabels[query.status] ?? query.status}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-gray-400">{query.user.name}</Text>
          <Text className="text-xs text-gray-300">·</Text>
          <Text className="text-xs text-gray-400">
            {format(new Date(query.created_at), 'dd MMM')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
