import { supabase } from '@/lib/supabase';
import type {
  IPaymentStrategy,
  PaymentResult,
  ProcessPaymentInput,
  RefundResult,
  ValidationResult,
} from './payment-strategy.interface';

export class EaziCashStrategy implements IPaymentStrategy {
  private eaziCashBalance: number;

  constructor(eaziCashBalance: number) {
    this.eaziCashBalance = eaziCashBalance;
  }

  validatePayment(input: ProcessPaymentInput): ValidationResult {
    if (input.amount <= 0) {
      return { valid: false, error: 'Payment amount must be greater than zero' };
    }
    if (this.eaziCashBalance < input.amount) {
      return {
        valid: false,
        error: `Insufficient EaZi Cash balance. Available: R${this.eaziCashBalance.toFixed(2)}`,
      };
    }
    if (input.type === 'booking' && !input.bookingId) {
      return { valid: false, error: 'Booking ID is required for booking payments' };
    }
    return { valid: true };
  }

  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const validation = this.validatePayment(input);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { data, error } = await supabase.functions.invoke<{
      transaction_id: string;
      success: boolean;
    }>('create-payment', {
      body: {
        amount: input.amount,
        booking_id: input.bookingId,
        type: input.type,
        currency: 'ZAR',
        method: 'eazi_cash',
        wallet_id: input.walletId,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data?.success) {
      return { success: false, error: 'EaZi Cash payment processing failed' };
    }

    return { success: true, transactionId: data.transaction_id };
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    const { data, error } = await supabase.functions.invoke<{
      refund_id: string;
      success: boolean;
    }>('create-payment', {
      body: {
        action: 'refund',
        transaction_id: transactionId,
        amount,
        method: 'eazi_cash',
        currency: 'ZAR',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, refundId: data?.refund_id };
  }
}
