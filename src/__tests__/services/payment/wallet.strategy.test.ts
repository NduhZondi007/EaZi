import { WalletStrategy } from '@/services/payment/wallet.strategy';
import type { ProcessPaymentInput } from '@/services/payment/payment-strategy.interface';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: jest.fn() },
  },
}));

import { supabase } from '@/lib/supabase';

const mockInvoke = supabase.functions.invoke as jest.Mock;

const baseInput: ProcessPaymentInput = {
  userId: 'user-1',
  walletId: 'wallet-1',
  amount: 100,
  type: 'booking',
  method: 'wallet',
  bookingId: 'booking-1',
};

describe('WalletStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── validatePayment ───────────────────────────────────────────────────────
  describe('validatePayment', () => {
    it('returns invalid when amount is zero', () => {
      const strategy = new WalletStrategy(500);
      const result = strategy.validatePayment({ ...baseInput, amount: 0 });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/greater than zero/i);
    });

    it('returns invalid when amount is negative', () => {
      const strategy = new WalletStrategy(500);
      const result = strategy.validatePayment({ ...baseInput, amount: -50 });
      expect(result.valid).toBe(false);
    });

    it('returns invalid when wallet balance is insufficient', () => {
      const strategy = new WalletStrategy(50);
      const result = strategy.validatePayment({ ...baseInput, amount: 100 });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/insufficient wallet balance/i);
      expect(result.error).toContain('R50.00');
    });

    it('returns invalid for booking type without bookingId', () => {
      const strategy = new WalletStrategy(500);
      const { bookingId: _, ...inputWithout } = baseInput;
      const result = strategy.validatePayment({ ...inputWithout, type: 'booking' });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/booking id is required/i);
    });

    it('returns valid when balance exactly equals amount', () => {
      const strategy = new WalletStrategy(100);
      const result = strategy.validatePayment({ ...baseInput, amount: 100 });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns valid for topup type without bookingId', () => {
      const strategy = new WalletStrategy(500);
      const result = strategy.validatePayment({ ...baseInput, type: 'topup', bookingId: undefined });
      expect(result.valid).toBe(true);
    });

    it('returns valid for a booking payment with sufficient balance', () => {
      const strategy = new WalletStrategy(500);
      const result = strategy.validatePayment(baseInput);
      expect(result.valid).toBe(true);
    });
  });

  // ── processPayment ────────────────────────────────────────────────────────
  describe('processPayment', () => {
    it('returns error immediately when validation fails', async () => {
      const strategy = new WalletStrategy(0);
      const result = await strategy.processPayment({ ...baseInput, amount: 100 });
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('calls supabase create-payment with correct wallet payload', async () => {
      const strategy = new WalletStrategy(500);
      mockInvoke.mockResolvedValueOnce({
        data: { transaction_id: 'txn-123', success: true },
        error: null,
      });

      const result = await strategy.processPayment(baseInput);

      expect(mockInvoke).toHaveBeenCalledWith('create-payment', {
        body: {
          amount: 100,
          booking_id: 'booking-1',
          type: 'booking',
          currency: 'ZAR',
          method: 'wallet',
          wallet_id: 'wallet-1',
        },
      });
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn-123');
    });

    it('returns error when supabase returns an error', async () => {
      const strategy = new WalletStrategy(500);
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Edge function failed'),
      });

      const result = await strategy.processPayment(baseInput);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('returns error when response success is false', async () => {
      const strategy = new WalletStrategy(500);
      mockInvoke.mockResolvedValueOnce({
        data: { success: false },
        error: null,
      });

      const result = await strategy.processPayment(baseInput);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/wallet payment processing failed/i);
    });
  });

  // ── refund ────────────────────────────────────────────────────────────────
  describe('refund', () => {
    it('calls supabase with correct refund payload', async () => {
      const strategy = new WalletStrategy(0);
      mockInvoke.mockResolvedValueOnce({
        data: { refund_id: 'ref-456', success: true },
        error: null,
      });

      const result = await strategy.refund('txn-123', 50);

      expect(mockInvoke).toHaveBeenCalledWith('create-payment', {
        body: {
          action: 'refund',
          transaction_id: 'txn-123',
          amount: 50,
          method: 'wallet',
          currency: 'ZAR',
        },
      });
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('ref-456');
    });

    it('returns error when supabase refund fails', async () => {
      const strategy = new WalletStrategy(0);
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Refund failed'),
      });

      const result = await strategy.refund('txn-123', 50);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
