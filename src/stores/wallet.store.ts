import { create } from 'zustand';
import { walletRepository } from '@/repositories/wallet.repository';
import { transactionRepository } from '@/repositories/transaction.repository';
import { paymentService } from '@/services/payment/payment.service';
import type { WalletRow, TransactionRow, PaymentMethod } from '@/types/database.types';

interface WalletState {
  wallet: WalletRow | null;
  transactions: TransactionRow[];
  isLoading: boolean;
  isPaymentProcessing: boolean;
  error: string | null;

  loadWallet(userId: string): Promise<void>;
  loadTransactions(userId: string): Promise<void>;
  initiateTopUp(
    userId: string,
    amount: number,
  ): Promise<{ checkoutUrl: string } | null>;
  payForBooking(
    bookingId: string,
    userId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<{ checkoutUrl?: string; success: boolean } | null>;
  refresh(userId: string): Promise<void>;
  clearError(): void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  isLoading: false,
  isPaymentProcessing: false,
  error: null,

  async loadWallet(userId: string) {
    set({ isLoading: true, error: null });
    try {
      const wallet = await walletRepository.findByUserId(userId);
      set({ wallet, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load wallet',
      });
    }
  },

  async loadTransactions(userId: string) {
    set({ isLoading: true, error: null });
    try {
      const transactions = await transactionRepository.findByUserId(userId);
      set({ transactions, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load transactions',
      });
    }
  },

  async initiateTopUp(userId: string, amount: number) {
    const wallet = get().wallet;
    if (!wallet) {
      set({ error: 'Wallet not found. Please reload or sign in again.' });
      return null;
    }

    set({ isPaymentProcessing: true, error: null });
    try {
      const result = await paymentService.pay(
        {
          userId,
          walletId: wallet.id,
          amount,
          type: 'topup',
          method: 'card',
        },
        {
          walletBalance: wallet.balance,
          eaziCashBalance: wallet.eazi_cash_balance,
        },
      );

      set({ isPaymentProcessing: false });

      if (!result.success) {
        set({ error: result.error ?? 'Top-up failed' });
        return null;
      }

      return { checkoutUrl: result.checkoutUrl! };
    } catch (err) {
      set({
        isPaymentProcessing: false,
        error: err instanceof Error ? err.message : 'Top-up initiation failed',
      });
      return null;
    }
  },

  async payForBooking(
    bookingId: string,
    userId: string,
    amount: number,
    method: PaymentMethod,
  ) {
    const wallet = get().wallet;
    if (!wallet) return null;

    set({ isPaymentProcessing: true, error: null });
    try {
      const result = await paymentService.pay(
        {
          bookingId,
          userId,
          walletId: wallet.id,
          amount,
          type: 'booking',
          method,
        },
        {
          walletBalance: wallet.balance,
          eaziCashBalance: wallet.eazi_cash_balance,
        },
      );

      set({ isPaymentProcessing: false });

      if (!result.success) {
        set({ error: result.error ?? 'Payment failed' });
        return null;
      }

      return { checkoutUrl: result.checkoutUrl, success: true };
    } catch (err) {
      set({
        isPaymentProcessing: false,
        error: err instanceof Error ? err.message : 'Payment failed',
      });
      return null;
    }
  },

  async refresh(userId: string) {
    await Promise.all([get().loadWallet(userId), get().loadTransactions(userId)]);
  },

  clearError() {
    set({ error: null });
  },
}));

export const selectWallet = (s: WalletState) => s.wallet;
export const selectTransactions = (s: WalletState) => s.transactions;
export const selectIsWalletLoading = (s: WalletState) => s.isLoading;
export const selectIsPaymentProcessing = (s: WalletState) => s.isPaymentProcessing;
export const selectWalletError = (s: WalletState) => s.error;
