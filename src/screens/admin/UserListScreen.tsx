import { Users } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AdminTabScreenProps } from '@/types/navigation.types';

type Props = AdminTabScreenProps<'Users'>;

export function UserListScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Users size={40} color="#9CA3AF" />}
        title="All Users"
        subtitle="Manage clients and service providers"
      />
    </ScreenWrapper>
  );
}
