import { supabase } from '@/lib/supabase';
import type { CardRow } from '@/types/database.types';

export interface ICardRepository {
  findByUserId(userId: string): Promise<CardRow[]>;
  setDefault(cardId: string, userId: string): Promise<void>;
  delete(cardId: string): Promise<void>;
}

export class CardRepository implements ICardRepository {
  async findByUserId(userId: string): Promise<CardRow[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw new Error(`CardRepository.findByUserId: ${error.message}`);
    return (data ?? []) as CardRow[];
  }

  async setDefault(cardId: string, userId: string): Promise<void> {
    const { error: clearError } = await supabase
      .from('cards')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (clearError) throw new Error(`CardRepository.setDefault clear: ${clearError.message}`);

    const { error } = await supabase
      .from('cards')
      .update({ is_default: true })
      .eq('id', cardId);

    if (error) throw new Error(`CardRepository.setDefault: ${error.message}`);
  }

  async delete(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) throw new Error(`CardRepository.delete: ${error.message}`);
  }
}

export const cardRepository = new CardRepository();
