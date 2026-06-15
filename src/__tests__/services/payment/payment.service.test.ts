import { PaymentService } from '@/services/payment/payment.service';
import { YocoCardStrategy } from '@/services/payment/yoco-card.strategy';
import { WalletStrategy } from '@/services/payment/wallet.strategy';
import { EaziCashStrategy } from '@/services/payment/eazicash.strategy';
import type { ProcessPaymentInput } from '@/services/payment/payment-strategy.interface';
import type { PaymentMethod } from '@/types/database.types';

jest.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));
jest.mock('@/services/payment/yoco-card.strategy');
jest.mock('@/services/payment/wallet.strategy');
jest.mock('@/services/payment/eazicash.strategy');

const MockYocoCardStrategy = YocoCardStrategy as jest.MockedClass<typeof YocoCardStrategy>;
const MockWalletStrategy = WalletStrategy as jest.MockedClass<typeof WalletStrategy>;
const MockEaziCashStrategy = EaziCashStrategy as jest.MockedClass<typeof EaziCashStrategy>;

const defaultBalances = { walletBalance: 0, eaziCashBalance: 0 };

const baseInput: ProcessPaymentInput = {
  userId: 'user-1',
  walletId: 'wallet-1',
  amount: 150,
  type: 'booking',
  method: 'card',
  bookingId: 'booking-1',
};

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService();
    jest.clearAllMocks();
  });

  // ── getAvailableMethods ───────────────────────────────────────────────────
  describe('getAvailableMethods', () => {
    it('always includes card regardless of balances', () => {
      const methods = service.getAvailableMethods({ walletBalance: 0, eaziCashBalance: 0 }, 100);
      expect(methods).toContain('card');
    });

    it('does not include wallet when balance is insufficient', () => {
      const methods = service.getAvailableMethods({ walletBalance: 50, eaziCashBalance: 0 }, 100);
      expect(methods).not.toContain('wallet');
    });

    it('includes wallet when balance equals amount', () => {
      const methods = service.getAvailableMethods({ walletBalance: 100, eaziCashBalance: 0 }, 100);
      expect(methods).toContain('wallet');
    });

    it('includes wallet when balance exceeds amount', () => {
      const methods = service.getAvailableMethods({ walletBalance: 200, eaziCashBalance: 0 }, 100);
      expect(methods).toContain('wallet');
    });

    it('does not include eazi_cash when balance is insufficient', () => {
      const methods = service.getAvailableMethods({ walletBalance: 0, eaziCashBalance: 30 }, 100);
      expect(methods).not.toContain('eazi_cash');
    });

    it('includes eazi_cash when balance equals amount', () => {
      const methods = service.getAvailableMethods({ walletBalance: 0, eaziCashBalance: 100 }, 100);
      expect(methods).toContain('eazi_cash');
    });

    it('returns all three methods when both balances are sufficient', () => {
      const methods = service.getAvailableMethods({ walletBalance: 200, eaziCashBalance: 200 }, 100);
      expect(methods).toContain('card');
      expect(methods).toContain('wallet');
      expect(methods).toContain('eazi_cash');
      expect(methods).toHaveLength(3);
    });

    it('returns only card when both balances are zero', () => {
      const methods = service.getAvailableMethods({ walletBalance: 0, eaziCashBalance: 0 }, 100);
      expect(methods).toEqual(['card']);
    });
  });

  // ── pay — strategy selection ──────────────────────────────────────────────
  describe('pay — strategy selection', () => {
    it('uses YocoCardStrategy for card method', async () => {
      const mockInstance = {
        validatePayment: jest.fn().mockReturnValue({ valid: true }),
        processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'chk-1' }),
        refund: jest.fn(),
      };
      MockYocoCardStrategy.mockImplementation(() => mockInstance as unknown as YocoCardStrategy);

      await service.pay({ ...baseInput, method: 'card' }, defaultBalances);
      expect(MockYocoCardStrategy).toHaveBeenCalledTimes(1);
    });

    it('uses WalletStrategy for wallet method', async () => {
      const balances = { walletBalance: 500, eaziCashBalance: 0 };
      const mockInstance = {
        validatePayment: jest.fn().mockReturnValue({ valid: true }),
        processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'txn-1' }),
        refund: jest.fn(),
      };
      MockWalletStrategy.mockImplementation(() => mockInstance as unknown as WalletStrategy);

      await service.pay({ ...baseInput, method: 'wallet' }, balances);
      expect(MockWalletStrategy).toHaveBeenCalledWith(500);
    });

    it('uses EaziCashStrategy for eazi_cash method', async () => {
      const balances = { walletBalance: 0, eaziCashBalance: 300 };
      const mockInstance = {
        validatePayment: jest.fn().mockReturnValue({ valid: true }),
        processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'ec-1' }),
        refund: jest.fn(),
      };
      MockEaziCashStrategy.mockImplementation(() => mockInstance as unknown as EaziCashStrategy);

      await service.pay({ ...baseInput, method: 'eazi_cash' }, balances);
      expect(MockEaziCashStrategy).toHaveBeenCalledWith(300);
    });

    it('throws when an unknown payment method is provided', async () => {
      await expect(
        service.pay(
          { ...baseInput, method: 'unknown' as PaymentMethod },
          defaultBalances,
        ),
      ).rejects.toThrow(/unknown payment method/i);
    });
  });

  // ── pay — validation gating ───────────────────────────────────────────────
  describe('pay — validation gating', () => {
    it('returns error without calling processPayment when validation fails', async () => {
      const mockProcessPayment = jest.fn();
      const mockInstance = {
        validatePayment: jest.fn().mockReturnValue({ valid: false, error: 'Amount too low' }),
        processPayment: mockProcessPayment,
        refund: jest.fn(),
      };
      MockYocoCardStrategy.mockImplementation(() => mockInstance as unknown as YocoCardStrategy);

      const result = await service.pay({ ...baseInput, method: 'card' }, defaultBalances);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount too low');
      expect(mockProcessPayment).not.toHaveBeenCalled();
    });

    it('calls processPayment and returns its result when validation passes', async () => {
      const mockInstance = {
        validatePayment: jest.fn().mockReturnValue({ valid: true }),
        processPayment: jest
          .fn()
          .mockResolvedValue({ success: true, transactionId: 'chk-ok' }),
        refund: jest.fn(),
      };
      MockYocoCardStrategy.mockImplementation(() => mockInstance as unknown as YocoCardStrategy);

      const result = await service.pay({ ...baseInput, method: 'card' }, defaultBalances);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('chk-ok');
      expect(mockInstance.processPayment).toHaveBeenCalledWith({ ...baseInput, method: 'card' });
    });
  });

  // ── refund ────────────────────────────────────────────────────────────────
  describe('refund', () => {
    it('delegates to the correct strategy refund method', async () => {
      const mockRefund = jest.fn().mockResolvedValue({ success: true, refundId: 'ref-1' });
      MockYocoCardStrategy.mockImplementation(
        () => ({ validatePayment: jest.fn(), processPayment: jest.fn(), refund: mockRefund } as unknown as YocoCardStrategy),
      );

      const result = await service.refund('card', 'txn-card', 100, defaultBalances);

      expect(mockRefund).toHaveBeenCalledWith('txn-card', 100);
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('ref-1');
    });
  });
});
