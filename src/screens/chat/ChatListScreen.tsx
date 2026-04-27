import { MessageSquare } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';

export function ChatListScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<MessageSquare size={40} color="#9CA3AF" />}
        title="No messages yet"
        subtitle="Your conversations with service providers will appear here"
      />
    </ScreenWrapper>
  );
}
