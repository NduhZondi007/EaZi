import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type {
  IPaymentStrategy,
  PaymentResult,
  ProcessPaymentInput,
  RefundResult,
  ValidationResult,
} from './payment-strategy.interface';

export class YocoCardStrategy implements IPaymentStrategy {
  validatePayment(input: ProcessPaymentInput): ValidationResult {
    if (input.amount <= 0) {
      return { valid: false, error: 'Payment amount must be greater than zero' };
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
      checkout_id: string;
      redirect_url: string;
    }>('create-payment', {
      body: {
        amount: input.amount,
        booking_id: input.bookingId,
        type: input.type,
        currency: 'ZAR',
        method: 'card',
      },
    });

    if (error) {
      return { success: false, error: await extractFunctionError(error) };
    }
    if (!data?.redirect_url) {
      return { success: false, error: 'No checkout URL returned from payment provider' };
    }

    return {
      success: true,
      transactionId: data.checkout_id,
      checkoutUrl: data.redirect_url,
    };
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    const { data, error } = await supabase.functions.invoke<{ refund_id: string }>(
      'create-payment',
      {
        body: {
          action: 'refund',
          transaction_id: transactionId,
          amount,
          currency: 'ZAR',
        },
      },
    );

    if (error) {
      return { success: false, error: await extractFunctionError(error) };
    }

    return { success: true, refundId: data?.refund_id };
  }
}

export const yocoCardStrategy = new YocoCardStrategy();

async function extractFunctionError(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError) {
    try {
      const body = await err.context.json() as { error?: string };
      if (body.error) return body.error;
    } catch {
      // response body not JSON — fall through to generic message
    }
  }
  return err instanceof Error ? err.message : 'Unknown payment error';
}
