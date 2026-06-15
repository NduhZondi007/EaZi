import { EaziCashStrategy } from '@/services/payment/eazicash.strategy';
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
  amount: 80,
  type: 'booking',
  method: 'eazi_cash',
  bookingId: 'booking-1',
};

describe('EaziCashStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── validatePayment ───────────────────────────────────────────────────────
  describe('validatePayment', () => {
    it('returns invalid when amount is zero', () => {
      const strategy = new EaziCashStrategy(200);
      expect(strategy.validatePayment({ ...baseInput, amount: 0 }).valid).toBe(false);
    });

    it('returns invalid when amount is negative', () => {
      const strategy = new EaziCashStrategy(200);
      expect(strategy.validatePayment({ ...baseInput, amount: -10 }).valid).toBe(false);
    });

    it('returns invalid when EaZi Cash balance is insufficient', () => {
      const strategy = new EaziCashStrategy(50);
      const result = strategy.validatePayment({ ...baseInput, amount: 80 });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/insufficient eazi cash balance/i);
      expect(result.error).toContain('R50.00');
    });

    it('returns invalid for booking type without bookingId', () => {
      const strategy = new EaziCashStrategy(200);
      const { bookingId: _, ...inputWithout } = baseInput;
      const result = strategy.validatePayment({ ...inputWithout, type: 'booking' });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/booking id is required/i);
    });

    it('returns valid when balance exactly equals amount', () => {
      const strategy = new EaziCashStrategy(80);
      expect(strategy.validatePayment({ ...baseInput, amount: 80 }).valid).toBe(true);
    });

    it('returns valid for topup without bookingId', () => {
      const strategy = new EaziCashStrategy(200);
      const result = strategy.validatePayment({ ...baseInput, type: 'topup', bookingId: undefined });
      expect(result.valid).toBe(true);
    });
  });

  // ── processPayment ────────────────────────────────────────────────────────
  describe('processPayment', () => {
    it('returns error immediately when validation fails', async () => {
      const strategy = new EaziCashStrategy(0);
      const result = await strategy.processPayment({ ...baseInput, amount: 80 });
      expect(result.success).toBe(false);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('calls supabase with correct eazi_cash payload', async () => {
      const strategy = new EaziCashStrategy(200);
      mockInvoke.mockResolvedValueOnce({
        data: { transaction_id: 'txn-ec-1', success: true },
        error: null,
      });

      const result = await strategy.processPayment(baseInput);

      expect(mockInvoke).toHaveBeenCalledWith('create-payment', {
        body: {
          amount: 80,
          booking_id: 'booking-1',
          type: 'booking',
          currency: 'ZAR',
          method: 'eazi_cash',
          wallet_id: 'wallet-1',
        },
      });
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn-ec-1');
    });

    it('returns error on supabase error', async () => {
      const strategy = new EaziCashStrategy(200);
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Network error') });
      const result = await strategy.processPayment(baseInput);
      expect(result.success).toBe(false);
    });

    it('returns error when response success is false', async () => {
      const strategy = new EaziCashStrategy(200);
      mockInvoke.mockResolvedValueOnce({ data: { success: false }, error: null });
      const result = await strategy.processPayment(baseInput);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/eazi cash payment processing failed/i);
    });
  });

  // ── refund ────────────────────────────────────────────────────────────────
  describe('refund', () => {
    it('calls supabase with correct eazi_cash refund payload', async () => {
      const strategy = new EaziCashStrategy(0);
      mockInvoke.mockResolvedValueOnce({
        data: { refund_id: 'ref-ec-1', success: true },
        error: null,
      });

      const result = await strategy.refund('txn-ec-1', 30);

      expect(mockInvoke).toHaveBeenCalledWith('create-payment', {
        body: {
          action: 'refund',
          transaction_id: 'txn-ec-1',
          amount: 30,
          method: 'eazi_cash',
          currency: 'ZAR',
        },
      });
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('ref-ec-1');
    });

    it('returns error when refund fails', async () => {
      const strategy = new EaziCashStrategy(0);
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Refund failed') });
      const result = await strategy.refund('txn-ec-1', 30);
      expect(result.success).toBe(false);
    });
  });
});
