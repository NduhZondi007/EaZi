import { Search } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ClientTabScreenProps } from '@/types/navigation.types';

type Props = ClientTabScreenProps<'Home'>;

export function HomeScreen(_: Props) {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Search size={40} color="#9CA3AF" />}
        title="Discover Services"
        subtitle="Find verified service providers near you"
      />
    </ScreenWrapper>
  );
}
