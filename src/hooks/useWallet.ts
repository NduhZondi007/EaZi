import { useEffect, useCallback } from 'react';
import {
  useWalletStore,
  selectWallet,
  selectTransactions,
  selectIsWalletLoading,
  selectIsPaymentProcessing,
  selectWalletError,
} from '@/stores/wallet.store';
import { useAuthStore } from '@/stores/auth.store';
import type { PaymentMethod } from '@/types/database.types';

export function useWallet() {
  const profile = useAuthStore((s) => s.profile);

  const wallet = useWalletStore(selectWallet);
  const transactions = useWalletStore(selectTransactions);
  const isLoading = useWalletStore(selectIsWalletLoading);
  const isPaymentProcessing = useWalletStore(selectIsPaymentProcessing);
  const error = useWalletStore(selectWalletError);

  const { loadWallet, loadTransactions, initiateTopUp, payForBooking, refresh, clearError } =
    useWalletStore();

  const load = useCallback(async () => {
    if (!profile?.id) return;
    await refresh(profile.id);
  }, [profile?.id, refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTopUp = useCallback(
    async (amount: number): Promise<{ checkoutUrl: string } | null> => {
      if (!profile?.id) {
        useWalletStore.setState({ error: 'Please sign in to top up your wallet.' });
        return null;
      }
      return initiateTopUp(profile.id, amount);
    },
    [profile?.id, initiateTopUp],
  );

  const handlePayForBooking = useCallback(
    async (
      bookingId: string,
      amount: number,
      method: PaymentMethod,
    ): Promise<{ checkoutUrl?: string; success: boolean } | null> => {
      if (!profile?.id) return null;
      return payForBooking(bookingId, profile.id, amount, method);
    },
    [profile?.id, payForBooking],
  );

  const reloadWallet = useCallback(async () => {
    if (!profile?.id) return;
    await loadWallet(profile.id);
  }, [profile?.id, loadWallet]);

  const reloadTransactions = useCallback(async () => {
    if (!profile?.id) return;
    await loadTransactions(profile.id);
  }, [profile?.id, loadTransactions]);

  return {
    wallet,
    transactions,
    isLoading,
    isPaymentProcessing,
    error,
    clearError,
    topUp: handleTopUp,
    payForBooking: handlePayForBooking,
    reload: load,
    reloadWallet,
    reloadTransactions,
  };
}
