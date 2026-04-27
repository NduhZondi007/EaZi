import { LayoutDashboard } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AdminTabScreenProps } from '@/types/navigation.types';

type Props = AdminTabScreenProps<'Dashboard'>;

export function AdminDashboardScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<LayoutDashboard size={40} color="#9CA3AF" />}
        title="Admin Dashboard"
        subtitle="Platform stats, users, and analytics"
      />
    </ScreenWrapper>
  );
}
