import { HelpCircle } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AdminTabScreenProps } from '@/types/navigation.types';

type Props = AdminTabScreenProps<'Queries'>;

export function QueriesListScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<HelpCircle size={40} color="#9CA3AF" />}
        title="Support Queries"
        subtitle="Manage and resolve user support tickets"
      />
    </ScreenWrapper>
  );
}
