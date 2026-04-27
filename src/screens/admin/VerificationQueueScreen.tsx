import { ShieldCheck } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AdminTabScreenProps } from '@/types/navigation.types';

type Props = AdminTabScreenProps<'Verification'>;

export function VerificationQueueScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<ShieldCheck size={40} color="#9CA3AF" />}
        title="Verification Queue"
        subtitle="Review and approve provider applications"
      />
    </ScreenWrapper>
  );
}
