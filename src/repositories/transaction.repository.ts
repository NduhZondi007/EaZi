import { supabase } from '@/lib/supabase';
import type { TransactionRow } from '@/types/database.types';

export interface ITransactionRepository {
  findByUserId(userId: string, limit?: number): Promise<TransactionRow[]>;
  findByWalletId(walletId: string, limit?: number): Promise<TransactionRow[]>;
  findById(id: string): Promise<TransactionRow | null>;
}

export class TransactionRepository implements ITransactionRepository {
  async findByUserId(userId: string, limit = 50): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`TransactionRepository.findByUserId: ${error.message}`);
    return (data ?? []) as TransactionRow[];
  }

  async findByWalletId(walletId: string, limit = 50): Promise<TransactionRow[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`TransactionRepository.findByWalletId: ${error.message}`);
    return (data ?? []) as TransactionRow[];
  }

  async findById(id: string): Promise<TransactionRow | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`TransactionRepository.findById: ${error.message}`);
    }

    return data as TransactionRow;
  }
}

export const transactionRepository = new TransactionRepository();
