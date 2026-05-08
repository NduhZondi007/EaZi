import { supabase } from '@/lib/supabase';
import type { WalletRow } from '@/types/database.types';

export interface IWalletRepository {
  findByUserId(userId: string): Promise<WalletRow | null>;
  findById(id: string): Promise<WalletRow | null>;
}

export class WalletRepository implements IWalletRepository {
  async findByUserId(userId: string): Promise<WalletRow | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`WalletRepository.findByUserId: ${error.message}`);
    }

    return data as WalletRow;
  }

  async findById(id: string): Promise<WalletRow | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`WalletRepository.findById: ${error.message}`);
    }

    return data as WalletRow;
  }
}

export const walletRepository = new WalletRepository();
