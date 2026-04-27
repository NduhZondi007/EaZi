import { BarChart2 } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AdminTabScreenProps } from '@/types/navigation.types';

type Props = AdminTabScreenProps<'Analytics'>;

export function AnalyticsScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<BarChart2 size={40} color="#9CA3AF" />}
        title="Analytics"
        subtitle="Revenue, bookings, and platform performance metrics"
      />
    </ScreenWrapper>
  );
}
