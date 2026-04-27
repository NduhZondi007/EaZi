import { Briefcase } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProviderTabScreenProps } from '@/types/navigation.types';

type Props = ProviderTabScreenProps<'Services'>;

export function MyServicesScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Briefcase size={40} color="#9CA3AF" />}
        title="No services yet"
        subtitle="Create your first service listing to start getting bookings"
        actionLabel="Create Service"
        onAction={() => {}}
      />
    </ScreenWrapper>
  );
}
