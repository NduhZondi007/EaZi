import type { PaymentMethod } from '@/types/database.types';

export interface ProcessPaymentInput {
  bookingId?: string;
  userId: string;
  walletId: string;
  amount: number;
  type: 'booking' | 'topup';
  method: PaymentMethod;
  cardId?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface IPaymentStrategy {
  processPayment(input: ProcessPaymentInput): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
  validatePayment(input: ProcessPaymentInput): ValidationResult;
}
