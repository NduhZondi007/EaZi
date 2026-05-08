import type { PaymentMethod } from '@/types/database.types';
import { YocoCardStrategy } from './yoco-card.strategy';
import { WalletStrategy } from './wallet.strategy';
import { EaziCashStrategy } from './eazicash.strategy';
import type {
  IPaymentStrategy,
  PaymentResult,
  ProcessPaymentInput,
  RefundResult,
} from './payment-strategy.interface';

export interface WalletBalances {
  walletBalance: number;
  eaziCashBalance: number;
}

export class PaymentService {
  private selectStrategy(method: PaymentMethod, balances: WalletBalances): IPaymentStrategy {
    switch (method) {
      case 'card':
        return new YocoCardStrategy();
      case 'wallet':
        return new WalletStrategy(balances.walletBalance);
      case 'eazi_cash':
        return new EaziCashStrategy(balances.eaziCashBalance);
      default: {
        const exhaustive: never = method;
        throw new Error(`Unknown payment method: ${String(exhaustive)}`);
      }
    }
  }

  async pay(
    input: ProcessPaymentInput,
    balances: WalletBalances,
  ): Promise<PaymentResult> {
    const strategy = this.selectStrategy(input.method, balances);

    const validation = strategy.validatePayment(input);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    return strategy.processPayment(input);
  }

  async refund(
    method: PaymentMethod,
    transactionId: string,
    amount: number,
    balances: WalletBalances,
  ): Promise<RefundResult> {
    const strategy = this.selectStrategy(method, balances);
    return strategy.refund(transactionId, amount);
  }

  getAvailableMethods(balances: WalletBalances, amount: number): PaymentMethod[] {
    const methods: PaymentMethod[] = ['card'];

    if (balances.walletBalance >= amount) {
      methods.push('wallet');
    }
    if (balances.eaziCashBalance >= amount) {
      methods.push('eazi_cash');
    }

    return methods;
  }
}

export const paymentService = new PaymentService();
