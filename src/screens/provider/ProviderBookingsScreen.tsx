import { Calendar } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProviderTabScreenProps } from '@/types/navigation.types';

type Props = ProviderTabScreenProps<'Bookings'>;

export function ProviderBookingsScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Calendar size={40} color="#9CA3AF" />}
        title="No bookings yet"
        subtitle="Incoming client bookings will appear here"
      />
    </ScreenWrapper>
  );
}
