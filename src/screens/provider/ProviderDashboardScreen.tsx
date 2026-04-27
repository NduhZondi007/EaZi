import { LayoutDashboard } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProviderTabScreenProps } from '@/types/navigation.types';

type Props = ProviderTabScreenProps<'Dashboard'>;

export function ProviderDashboardScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<LayoutDashboard size={40} color="#9CA3AF" />}
        title="Provider Dashboard"
        subtitle="View your earnings, bookings, and performance stats"
      />
    </ScreenWrapper>
  );
}
