import { Calendar } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ClientTabScreenProps } from '@/types/navigation.types';

type Props = ClientTabScreenProps<'Bookings'>;

export function BookingsListScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Calendar size={40} color="#9CA3AF" />}
        title="No bookings yet"
        subtitle="When you book a service, it will appear here"
      />
    </ScreenWrapper>
  );
}
