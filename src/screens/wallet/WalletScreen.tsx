import { Wallet } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';

export function WalletScreen() {
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Wallet size={40} color="#9CA3AF" />}
        title="Your Wallet"
        subtitle="Manage your balance, transactions, and saved cards"
      />
    </ScreenWrapper>
  );
}
