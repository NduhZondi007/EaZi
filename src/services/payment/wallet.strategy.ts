import { supabase } from '@/lib/supabase';
import type {
  IPaymentStrategy,
  PaymentResult,
  ProcessPaymentInput,
  RefundResult,
  ValidationResult,
} from './payment-strategy.interface';

export class WalletStrategy implements IPaymentStrategy {
  private walletBalance: number;

  constructor(walletBalance: number) {
    this.walletBalance = walletBalance;
  }

  validatePayment(input: ProcessPaymentInput): ValidationResult {
    if (input.amount <= 0) {
      return { valid: false, error: 'Payment amount must be greater than zero' };
    }
    if (this.walletBalance < input.amount) {
      return {
        valid: false,
        error: `Insufficient wallet balance. Available: R${this.walletBalance.toFixed(2)}`,
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
        method: 'wallet',
        wallet_id: input.walletId,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data?.success) {
      return { success: false, error: 'Wallet payment processing failed' };
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
        method: 'wallet',
        currency: 'ZAR',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, refundId: data?.refund_id };
  }
}
