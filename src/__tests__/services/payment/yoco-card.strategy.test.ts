import { YocoCardStrategy } from '@/services/payment/yoco-card.strategy';
import type { ProcessPaymentInput } from '@/services/payment/payment-strategy.interface';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: jest.fn() },
  },
}));

import { supabase } from '@/lib/supabase';

const mockInvoke = supabase.functions.invoke as jest.Mock;

const baseBookingInput: ProcessPaymentInput = {
  userId: 'user-1',
  walletId: 'wallet-1',
  amount: 250,
  type: 'booking',
  method: 'card',
  bookingId: 'booking-1',
};

const baseTopupInput: ProcessPaymentInput = {
  userId: 'user-1',
  walletId: 'wallet-1',
  amount: 100,
  type: 'topup',
  method: 'card',
};

describe('YocoCardStrategy', () => {
  let strategy: YocoCardStrategy;

  beforeEach(() => {
    strategy = new YocoCardStrategy();
    jest.clearAllMocks();
  });

  // ── validatePayment ───────────────────────────────────────────────────────
  describe('validatePayment', () => {
    it('returns invalid when amount is zero', () => {
      const result = strategy.validatePayment({ ...baseBookingInput, amount: 0 });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/greater than zero/i);
    });

    it('returns invalid when amount is negative', () => {
      const result = strategy.validatePayment({ ...baseBookingInput, amount: -1 });
      expect(result.valid).toBe(false);
    });

    it('returns invalid for booking type without bookingId', () => {
      const result = strategy.validatePayment({ ...baseBookingInput, bookingId: undefined });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/booking id is required/i);
    });

    it('returns valid for a booking payment with bookingId', () => {
      const result = strategy.validatePayment(baseBookingInput);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns valid for a topup without bookingId', () => {
      const result = strategy.validatePayment(baseTopupInput);
      expect(result.valid).toBe(true);
    });
  });

  // ── processPayment ────────────────────────────────────────────────────────
  describe('processPayment', () => {
    it('returns error immediately when validation fails', async () => {
      const result = await strategy.processPayment({ ...baseBookingInput, amount: 0 });
      expect(result.success).toBe(false);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('calls supabase create-payment with correct card payload', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { checkout_id: 'chk-123', redirect_url: 'https://pay.yoco.com/chk-123' },
        error: null,
      });

      const result = await strategy.processPayment(baseBookingInput);

      expect(mockInvoke).toHaveBeenCalledWith('create-payment', {
        body: {
          amount: 250,
          booking_id: 'booking-1',
          type: 'booking',
          currency: 'ZAR',
          method: 'card',
        },
      });
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('chk-123');
      expect(result.checkoutUrl).toBe('https://pay.yoco.com/chk-123');
    });

    it('returns error when supabase returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Edge function timeout'),
      });

      const result = await strategy.processPayment(baseBookingInput);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('returns error when redirect_url is missing from response', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { checkout_id: 'chk-999' },
        error: null,
      });

      const result = await strategy.processPayment(baseBookingInput);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no checkout url/i);
    });

    it('processes topup payment without booking_id', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { checkout_id: 'chk-topup', redirect_url: 'https://pay.yoco.com/topup' },
        error: null,
      });

      await strategy.processPayment(baseTopupInput);

      const callBody = mockInvoke.mock.calls[0][1].body;
      expect(callBody.booking_id).toBeUndefined();
      expect(callBody.type).toBe('topup');
    });
  });

  // ── refund ────────────────────────────────────────────────────────────────
  describe('refund', () => {
    it('calls supabase with correct refund payload', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { refund_id: 'ref-card-1' },
        error: null,
      });

      const result = await strategy.refund('chk-123', 250);

      expect(mockInvoke).toHaveBeenCalledWith('create-payment', {
        body: {
          action: 'refund',
          transaction_id: 'chk-123',
          amount: 250,
          currency: 'ZAR',
        },
      });
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('ref-card-1');
    });

    it('returns error when refund supabase call fails', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Yoco refund failed') });
      const result = await strategy.refund('chk-123', 250);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
